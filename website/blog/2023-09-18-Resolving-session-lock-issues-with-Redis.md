---
title: Resolving session lock issues with Redis
authors: Scott
---

At Sykes we use multiple servers to handle web traffic, as a result of that we need a way to ensure that browser session data can exist between requests. There are multiple ways to do this - we decided that redis was the most suitable for us.

Redis allows us to evenly distribute load between PHP servers, while keeping the data in the session highly available (failover redis cluster, provided by [Elasticache](https://aws.amazon.com/elasticache/)). This means that if a node fails, we have a hot backup to switch to.

This blog explores an issue we had after an upgrade and how we identified, found and fixed the issue in the redis driver.


## Session locks

Sessions allow a stateless transport method such as HTTP to maintain state between requests. This happens by giving the user a cookie with a unique string, allowing the server side to store data about a user. This usually includes preferences they have selected or things which are slow to calculate giving them a personalised and performant experience. This data is stored and read from redis.

To maintain a consistent set of data, [PHP has session locking](https://www.php.net/manual/en/features.session.security.management.php#features.session.security.management.session-locking) built in. This means that if you want to write to the session, you need to lock the session to prevent others writing potentially conflicting data.

```

|================|  Page load 1  
           |==============| Page load 2
```
The above shows a simple example:
- Page load 2 starts before page load 1 has finished
- If page load 1 changes something in the session, page load 2 wouldn't know about it. 
- If page load 1 sets `foo` to `bar` and page load 2 sets `foo` to `baz`, which one should be used for the next request?

This gets even more complicated in the below example:

```

|=============================|  Page load 1  

           |==============| Page load 2
```

Now page load 2 starts after page load 1, and also finishes before page load 1 finishes; this makes it really hard to know which version to use.

Session locking resolves this by allowing only one-page load to access the session at once, transforming the above to

```

|================|  Page load 1  
           |******==============| Page load 2  
  
  
|=============================|  Page load 1  
           |*******************==============| Page load 2
```
The stars indicate the session waiting to be unlocked. This leaves the session updates unambiguous, but makes the client wait more for the loads to happen. This is especially true for sites with multiple AJAX requests or simply a user with two or more tabs loading multiple pages - for example, side by side browsing some of our properties.


## What we noticed

After a release, we had a small number of alerts relating to not being able to get a valid session ID.

![Redis issue](/img/postimages/redis-issue/errors.png)

This caused a small number of errors, enough to trigger alerting, but was certainly not widespread. We have a team of developers who look at these issues as they arise; the first port of call for something like this is checking what is in the release. The errors were relating to getting an invalid session ID after `session_start()` was called.

The releases we do at Sykes are very small, so that in situations like this we can quickly see was it caused by the code in the release or something else? In this case, the changes were small, comprised of HTML and JavaScript changes - so we can easily rule them out as they have no impact on the server side.

This likely means that it was something else as part of the release which caused this issue; as we deploy with ECS Fargate, all of the images are available in [ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html), so we downloaded the most recent release before the issue and the one which caused the issue and used Google's [container-diff](https://github.com/GoogleContainerTools/container-diff) which showed there was only one difference, a PHP redis upgrade.

The issue only happens on some requests, which makes understanding the problem much harder; we need a way to replicate this request.

## Replicating the problem

When resolving issues, it's always useful to get the smallest reproducible case with as few dependencies as possible; this helps everyone involved be clear about what the problem is.

The first step was getting a super simple page set up - I did this through docker-compose to bring online a Redis server and a really simple PHP page (just calling `session_start()`) and see how I could make this happen on every single request. I started looking at the diff of [phpredis](https://github.com/phpredis/phpredis/compare/6.0.0...5.3.7) and saw there was some support for backoff strategies for the locking, so I started to have a look there. The issue had to be elsewhere after seeing that the driver still worked.

As the issue was around sessions and locking, the next thing was to add a large sleep to the request and force a record lock to happen. This caused an issue, so I downgraded Redis in the repeatable case, and the problem disappeared. So, we now have a repeatable case in a few lines of code.

See below for the examples;

Request 1
```
<?php

session_start();

sleep(10);

echo session_id(); // Returns a valid id
```

Request 2

```
<?php

session_start(); // this should block until request 1 has completed

sleep(10);

echo session_id(); // No valid session returned
```

## Fixing the issue

Now that we have a [repeatable case](https://github.com/exussum12/redis-issue), we can dig into the difference in the cases. Redis has an excellent [Monitor mode](https://redis.io/commands/monitor/) so it's a great place to start looking for the differences.

Dumping out the commands sent for [5.3.7](https://github.com/exussum12/redis-issue/blob/master/5.3.7) and [6.0.0](https://github.com/exussum12/redis-issue/blob/master/6.0.0) shows that there is a missing `GET` request after the `SET`'s on the locks. That is very consistent with what we are seeing in the front end as no session data is obtained. Now, to look into the code to see what's going on.

The session code seems quite simple and looking at the diff just for this file, it looks like debugging was added, but also, a [return was added](https://github.com/phpredis/phpredis/commit/687a0b405051adada1ff460a3863d0f85cd6e98a#diff-d7896829bc47f45d33720c352a4b8aabd4dca447b6db9e2d4205be5b44ba5d9eR714) in cases where a session lock couldn't be obtained. This return changes the behaviour and returns a failure; this stops the rest of the code from getting the session data. Previously, when a lock couldn't be achieved, the read-only session was returned. This is a better default position to be in than no data.

Checking out the code and making the change locally confirms that this resolves the issue. This issue did highlight that this small number of session have always been problematic; if something changes on those page views in the session, it won't be saved due to the session being read only; in our use case, this is much less problematic than the session appearing to not exist.

## Conclusion

The update made upstream changes a soft failure to a hard failure - that is, when the session lock can not be obtained, changing from failing with session data to failing without. The commit which added this issue was about trying to make the errors more verbose so the end user has a better idea of what is happening internally.

The 5.3.7 version shows this when trying to write.

```
<b>Warning</b>:  Unknown: Failed to write session data (redis). Please verify that the current setting of session.save_path is correct (redis:6379) in <b>Unknown</b> on line <b>0</b><br />
```
The Unknown on line 0 is not too helpful to debug, but the rest of the error at least points it to the correct place. In my opinion its more correct to do this, as the issue is not reading the session but writing. In general reading takes place more often than writing, so having the error only occur on write makes more sense. If you fail to read you don't know who the user is at that point so can not handle it gracefully - having the users information gives you more choice (write to a database for example)

This was an interesting problem to solve as it appeared to be intermittent, and after replicating the issue the fix was quite simple - the process of reducing the problem to the smallest reproducible case helped a huge amount in being able to find and fix the problem.


## About Sykes

The techniques shared in this article were produced by the development team at Sykes. If you are a talented Data Scientist, Analyst or Developer please check out our [current vacancies](https://www.sykescottages.co.uk/careers/).

