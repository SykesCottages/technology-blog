module.exports={
  "title": "Sykes Holiday Cottages",
  "tagline": "Technology Blog",
  "url": "https://sykes.technology",
  "baseUrl": "/",
  "organizationName": "sykescottages",
  "projectName": "technology-blog",
  "favicon": "img/favicon.ico",
  "customFields": {
    "disableHeaderTitle": true,
    "fonts": {
      "primaryFont": [
        "Montserrat",
        "sans-serif"
      ],
      "secondaryFont": [
        "Roboto",
        "sans-serif"
      ]
    },
    "facebookAppId": 236941918291,
    "blogSidebarCount": "ALL"
  },
  "onBrokenLinks": "log",
  "onBrokenMarkdownLinks": "log",
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": false,
        "blog": {
					"routeBasePath": "blog",
          "path": "blog",
					"blogSidebarTitle": 'All posts',
          "blogSidebarCount": 'ALL',
        }
      }
    ]
  ],
  "plugins": [],
  "themeConfig": {
    "colorMode": {
	    defaultMode: 'dark',
	    disableSwitch: false,
        respectPrefersColorScheme: false
	},
    "navbar": {
      "title": "Sykes Holiday Cottages",
      "logo": {
        "src": "img/sykes-primary-logo.svg",
        "srcDark": "img/sykes-primary-logo-white.svg"
      },
      "items": []
    },
    "footer": {
      "links": [
        {
          "title": "Community",
          "items": [
            {
              "label": "Twitter",
              "to": "https://twitter.com/SykesDev"
            }
          ]
        }
      ],
      "copyright": `Copyright © ${new Date().getFullYear()} Sykes Holiday Cottages`,
      "logo": {
        "src": "img/sykes-primary-logo-white-small.svg"
      }
    }
  }
}
