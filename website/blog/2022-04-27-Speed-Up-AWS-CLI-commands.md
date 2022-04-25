---
title: Speed up AWS CLI commands
unlisted: true
author: Scott Dutton
authorURL: https://www.twitter.com/exusssum
---

At Sykes we store our backups in S3, we currently have daily backups stored with a lifecycle according to our policies.

I was recently looking at some of these backups and looking at how we could store this in a more cost effective way. For example it's unlikely for us to need a daily backup from 6 months ago, a monthly backup will be more suitable for that long ago. Daily backups make more sense in a shorter timeframe, eg last week.

We decided to reduce the amount of daily backups to 90 days, keeping the monthly backup for a longer time period, which will reduce the total amount of storage needed. To get to this place, we need to tag all of the objects in the bucket with the type of backup. We had lot's of objects already stored which needed tagging correctly.



## The tagging

Tagging in objects in bulk is a solved problem, questions such as this on stackoverflow show you how tagging in bulk would work.

https://stackoverflow.com/questions/45676862/aws-s3-cli-tag-all-objects-within-a-directory


```
aws s3api list-objects --bucket your-bucket-name --query 'Contents[].{Key:Key}' --output text | xargs -n 1 aws s3api put-object-tagging  --bucket your-bucket-name --tagging 'TagSet=[{Key=colour,Value=blue}]' --key
```

Breaking this down a little, we are getting all of the objects and the passing over to another s3 command to do the tag. We would want to filter the objects so we can add a grep in between.

```
aws s3api list-objects --bucket your-bucket-name --query 'Contents[].{Key:Key}' --output text |\
grep "some-term" |\
xargs -n 1 aws s3api put-object-tagging  --bucket your-bucket-name --tagging 'TagSet=[{Key=colour,Value=blue}]' --key
```

This works well on a small scale. I could see from the output that that was working, but it would have taken days to tag all of the objects.

## Scaling this method

On a small scale (1,000 objects) a tagging takes 12.5 minutes. That comes out at 1.3 objects per second, which is actually quite slow.

The script works in effect the same as below

```
aws s3api put-object-tagging object1
aws a3api put-object-tagging object2
```

The AWS CLI is a wrapper around a HTTPS API, so seeing the commands like that makes it clear that you can't reuse a HTTPS connection. This means each request is a DNS query,TCP negotiation, TLS negotiation and then finally the HTTP request and HTTP response.

Previous work on reducing the HTTPS overhead has proved that using Nginx as a reuse proxy with a keepalive connection to the backend HTTPS server has shown real performance increases.

A sample nginx config is below which would allow this


```
upstream s3 {
  keepalive 100;

  server your-bucket-name.s3-eu-west-1.amazonaws.com:443;
}

server {
  listen 80;
  server_name s3.localhost;
  location / {
    proxy_set_header Host your-bucket-name.s3-eu-west-1.amazonaws.com;
    proxy_pass https://s3;
  }
}


```

and a docker command to use this (assuming it's saved to a file called nginx.conf in your current working directory)

```
docker run -v `pwd`/nginx.conf:/etc/nginx/conf.d/default.conf:ro -p 12345:80 nginx
```

This brings up a docker container on the host port 12345, which will keep a connection alive, this removed the DNS lookup, TCP connection and TLS connection per request.

Anything `.localhost` resolves to 127.0.0.1 so it's a great no config way of geting this to work. We can then override the endpoint which the AWS CLI uses to use this localhost connection instead by passing `--endpoint s3.localhost` to the AWS CLI.

Running the same 1,000 objects though now returns in 7 minutes 1.6 seconds a 45% reduction in time taken!
This increases the objects per second to 2.37.


## Going even faster

xargs by default runs one process at a time, so by default running 1 simultaneous request. nginx is also designed to handle multiple requests, so we could start to thread the requests.

xargs has a very nice flag which allows this, `-P {number}` will allow you to run the number passed of processes in parallel, this takes advantage of almost every machine having more than 1 thread available.

You can choose any number for this, I have 16 CPU's available on my machince (on linux running `nproc` will confirm) I chose 10 as a test number, this leaves the final command as


```
aws s3api list-objects --bucket your-bucket-name --query 'Contents[].{Key:Key}' --output text |\
grep "some-term" |\
xargs -n 1 -P 10 aws --endpoint http://s3.localhost s3api put-object-tagging  --bucket your-bucket-name --tagging 'TagSet=[{Key=colour,Value=blue}]' --key
```


and that now runs in 45 seconds for the same test 1,000 objects, bringing the total to 22.2 requests per second!

## Conclusion

Connections, especially TLS connections take time to make, for any large amount of requests (either via automated means or natrual if a HTTPS connection is made as part of an API call) could be reused and improved in a simular way. It's transparent to the end service (in this case s3), but it does require an extra service in place which could go wrong.

We went from 1.3 objects per second to 22.2 objects per second (a 1707% increase) and wall time from 12 minutes and 30 seconds to 45 seconds which is a reduction of 94% from a minor tweak to the connections.

## About Sykes

The techniques shared in this article were produced by the development team at Sykes. If you are a talented Data Scientist, Analyst or Developer please check out our [current vacancies](https://www.sykescottages.co.uk/careers/).

