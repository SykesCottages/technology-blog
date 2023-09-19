---
title: Resolving session lock issues with Redis
authors: Scott
draft: true
---

At Sykes we use multiple servers to handle web traffic, as a result of that we need a way to ensure that browser session data can exist between requests, there are multiple ways to do this, we decided that redis was the most suitable for us.

Redis allows us to evenly distribute load between PHP servers, while keeping the data in the session also highly available (failover redis cluster, provided by Elasticache), so that if a node fails, we have a hot backup to switch to.

This blog explores an issue we had using redis as our session handler with an upgrade to redis and how we identified, found and fixed the issue in the redis driver.



## Session locks

Sessions allow a stateless transport, like HTTP to maintain state between requests. This happens by giving the user a cookie with a unique string, allowing the server side to store data about a user, such as preferences selected or things which are slow to calculate, so the users experience is faster. To do this the data is stored and read from redis.

To maintain a consistent set of data, PHP has session locking built in this means that if you want to write to the session, you need to lock the session to prevent others writing potentially conflicting data.

```

|================|  Page load 1  
           |==============| Page load 2
```
The above shows a simple example, page load 2 starts before page load 1 has finished, if page load 1 changes something in the session page load 2 wouldn't know about it. This is worse for writing to the session, if page load 1 sets `foo` to `bar` and page load 2 sets to baz, which one should be used for the next request?

This gets even more complicated in the below example

```

|=============================|  Page load 1  

           |==============| Page load 2
```

Now page load 2 starts after page load 1, and also finishes before page load 1 finishes, this makes it really hard to know which version to use.

Session locking resolves this by allowing only one page load to be used at a single time, transforming the above to

```

|================|  Page load 1  
           |******==============| Page load 2  
  
  
|=============================|  Page load 1  
           |*******************==============| Page load 2
```
where the stars now indicate the session waiting to be unlocked. This leaves the session updates unambiguous, but makes the client wait more for the loads to happen, this is especially true for sites with multiple Ajax requests, or simply a user with two or more tabs loading multiple pages, for example side by side browsing some of our properties.



## What we noticed

After a release we had a small number of alerts relating to not being able to get a valid session id.

![Redis issue](/img/postimages/redis-issue/errors.png)

This caused a small number of errors, enough to trigger altering but was certainly not widespread. We have a team of developers who look at this issues as they arise, the first port of call for something like this is checking what as in the release. The errors were relating to getting an invalid session id after session_start was called.

The releases we do at Sykes are very small, so that in situations like this we can quickly see was it caused by the code in the release or something else? In this case the changes were small HTML and JavaScript changes, so we can easily rule that out as they have no impact the server side.

This likely means that it was something else as part of the release which caused this issue, as we deploy with ECS Fargate, all of the images are available in [ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html), so we downloaded the most recent release before the issue and the one which caused the issue and used google's [container-diff](https://github.com/GoogleContainerTools/container-diff) which shown there was only one difference, a php redis upgrade.

The issue doesn't happen on every request which makes understanding the issue much harder, we need a way to replicate this request.

## Replicating the problem

When resolving issues, its always useful to get the smallest reproducible case with as few dependencies as possible, this helps everyone involved be clear what the issue is.

First step was getting a super simple page set up, I did this though docker-compose to bring online a redis server and a really simple php page (just calling session_start) and see how I can make this happen on every single request. I started looking at the diff of [phpredis](https://github.com/phpredis/phpredis/compare/6.0.0...5.3.7) and seen there was some support for backoff strategies for the locking, so started to have a look there. After seeing the driver still worked the issue had to be elsewhere.

As the issue was around sessions and locking, the next thing was to add a large sleep to the request and forcing a record lock to happen. This seemed to cause an issue, so downgraded redis in the repeatable case and the issue went away. So in a few lines of code we now have a repeatable case.

## Fixing the issue

Now we have a repeatable case, we can dig into the difference in the cases. Redis has an excellent [Monitor mode](https://redis.io/commands/monitor/) so its a great place to start looking for the differences. 

Dumping out the commands sent for [5.3.7](https://github.com/exussum12/redis-issue/blob/master/5.3.7) and [6.0.0](https://github.com/exussum12/redis-issue/blob/master/6.0.0) shows that there is a missing GET request after the SET's on the locks. That is very consistent with what we are seeing in the from the front end as no session data is obtained. Now to look into the code to see whats going on.

The session code seems quite simple and looking at the diff just for this file, it looks like debugging was added, but also a [return was added](https://github.com/phpredis/phpredis/commit/687a0b405051adada1ff460a3863d0f85cd6e98a#diff-d7896829bc47f45d33720c352a4b8aabd4dca447b6db9e2d4205be5b44ba5d9eR714) in when a session lock couldn't be completed. This return changes the behaviour and returns a failure, this stops the rest of the code getting the session data, previously when a lock couldn't be achieved the read only session was returned. This is a better default position to be in than no data.

Checking out the code and making the change locally confirm that this resolves the issue. This issue did highlight that this small number of session have always been problematic, if something changes on those page views in the session, it won't be saved due to the session being read only, in our use case this is much less problematic than the session appearing to not exist.

## Conclusion

The change made upstream changes a soft failure to a hard failure, that is when the session lock can not be obtained change from failing with session data to failing without.  The commit which added this issue was about trying to make the errors more verbose so the end user has a better idea of what is happening internally.

The 5.3.7 version shown this when trying to write.

```
<b>Warning</b>:  Unknown: Failed to write session data (redis). Please verify that the current setting of session.save_path is correct (redis:6379) in <b>Unknown</b> on line <b>0</b><br />
```
The Unknown on line 0 is not too helpful to debug, but the rest of the error at least points it to the correct place. In my opinion its more correct to do this, as the issue is not reading the session but writing, in general reading takes place more often than writing so having the error only occur on write makes more sense, especially as if you fail to read you don't know who the user is at that point so can not handle it gracefully for that user, having the users information gives you more choice (write to a database for example) 

This was an interesting problem to solve as it appeared to be intermittent, and after replicating the issue the fix was quite simple, the process of reducing the problem to the smallest reproducible case helped a huge amount in being able to find and fix the problem.



## About Sykes

The techniques shared in this article were produced by the development team at Sykes. If you are a talented Data Scientist, Analyst or Developer please check out our [current vacancies](https://www.sykescottages.co.uk/careers/).

