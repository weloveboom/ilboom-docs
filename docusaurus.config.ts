import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ILBOOM Docs',
  tagline: 'Documentación del proyecto ILBOOM',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: 'https://docs.weloveboom.cloud',
  baseUrl: '/',

  organizationName: 'weloveboom',
  projectName: 'ilboom-docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/weloveboom/ilboom-docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/ilboom-social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ILBOOM',
      logo: {
        alt: 'ILBOOM',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          label: 'API Reference',
          position: 'left',
          href: 'https://api.weloveboom.cloud/ib/api/docs',
        },
        {
          href: 'https://github.com/weloveboom',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            { label: 'Arquitectura', to: '/arquitectura' },
            { label: 'Módulos', to: '/modulos' },
            { label: 'Despliegue', to: '/despliegue' },
          ],
        },
        {
          title: 'API y Componentes',
          items: [
            { label: 'API Reference (Swagger)', href: 'https://api.weloveboom.cloud/ib/api/docs' },
            { label: 'Storybook', href: '#' },
          ],
        },
        {
          title: 'Enlaces',
          items: [
            { label: 'ILBOOM', href: 'https://weloveboom.cloud' },
            { label: 'GitHub', href: 'https://github.com/weloveboom' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ILBOOM. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
