
# What's In This Document
- [Setting Up Docker](#setting-up-docker)
- [Setting Up Local Dev](#setting-up-local-dev)
- [Editing Content](#editing-content)
- [Adding Content](#adding-content)
- [Full Documentation](#full-documentation)

# Setting Up Docker
```sh
# Start docker in detached mode
docker-compose up -d

# Start docker in attached mode
docker-compose up
```

# Setting Up Local Dev
1. Make sure all the dependencies for the website are installed locally
- yarn
- nodejs
```sh
# Ubuntu 20.4 users should be able to run.
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update
sudo apt install yarn nodejs
```

2. Install dependencies via yarn
```sh
# Install dependencies
cd to the website/ folder and run 
yarn
```

2. Run your dev server:
```sh
# Start the site
yarn start

You should see the following result, along with the browser window popping open to https://localhost:3000/blog/
# yarn run v1.22.15
# warning package.json: No license field
# $ docusaurus-start
# LiveReload server started on port 35729
# Docusaurus server started on port 3000
```

# Editing an existing blog post
Edit blog posts by navigating to `website/blog` and editing the corresponding post:

`website/blog/post-to-be-edited.md`

```markdown
---
id: post-needs-edit
title: This Blog Post Needs To Be Edited
---

Edit me...
```

For more information about blog posts, click [here](https://docusaurus.io/docs/en/adding-blog)

# Adding a new blog post
1. Make sure there is a header link to your blog in `website/siteConfig.js`:

`website/siteConfig.js`

```javascript
headerLinks: [
    ...
    { blog: true, label: 'Blog' },
    ...
]
```

2. Create the blog post with the format `YYYY-MM-DD-My-Blog-Post-Title.md` in `website/blog`:

`website/blog/2018-05-21-New-Blog-Post.md`

```markdown
---
author: Frank Li
authorURL: https://twitter.com/foobarbaz
authorFBID: 503283835
title: New Blog Post
---

Lorem Ipsum...
```

For more information about blog posts, click [here](https://docusaurus.io/docs/en/adding-blog)

## Adding items to your site's top navigation bar

1. Add links to docs, custom pages or external links by editing the headerLinks field of `website/siteConfig.js`:

`website/siteConfig.js`

```javascript
{
  headerLinks: [
    ...
    /* you can add docs */
    { doc: 'my-examples', label: 'Examples' },
    /* you can add custom pages */
    { page: 'help', label: 'Help' },
    /* you can add external links */
    { href: 'https://github.com/facebook/docusaurus', label: 'GitHub' },
    ...
  ],
  ...
}
```

For more information about the navigation bar, click [here](https://docusaurus.io/docs/en/navigation)

## Adding custom pages
1. Docusaurus uses React components to build pages. The components are saved as .js files in `website/pages/en`:
1. If you want your page to show up in your navigation header, you will need to update `website/siteConfig.js` to add to the `headerLinks` element:

`website/siteConfig.js`

```javascript
{
  headerLinks: [
    ...
    { page: 'my-new-custom-page', label: 'My New Custom Page' },
    ...
  ],
  ...
}
```

For more information about custom pages, click [here](https://docusaurus.io/docs/en/custom-pages).

# Full Documentation
Full documentation can be found on the [website](https://docusaurus.io/).
