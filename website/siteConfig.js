const siteConfig = {
  title: 'Sykes Holiday Cottages',
  disableHeaderTitle: true,
  tagline: 'Technology Blog',
  url: 'https://sykes.dev',
  baseUrl: '/',
  projectName: 'technology-blog',
  organizationName: 'sykescottages',
  headerLinks: [{
    blog: true,
    label: 'Technology Blog'
  }],
  headerIcon: 'img/sykes-primary-logo-white.svg',
  footerIcon: 'img/sykes-primary-logo-white-small.svg',
  favicon: 'img/favicon.ico',
  colors: {
    primaryColor: '#215aa8',
    secondaryColor: '#143f6f',
  },
  fonts: {
    primaryFont: [
      'Montserrat',
      'sans-serif'
    ],
    secondaryFont: [
      'Roboto',
      'sans-serif'
    ],
  },
  copyright: `Copyright © ${new Date().getFullYear()} Sykes Holiday Cottages`,
  highlight: {
    theme: 'default',
  },
  cleanUrl: true,
  twitterImage: 'img/sykes-twitter-logo.jpg',
  twitter: true,
  twitterUsername: 'sykescottages',
  facebookAppId: 236941918291,
  facebookComments: true,
};

module.exports = siteConfig;
