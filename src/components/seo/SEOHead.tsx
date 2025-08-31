import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: string[];
  canonicalUrl?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultMeta = {
  title: 'ADHD Task Manager - Focus & Productivity Tool',
  description: 'Boost your productivity with ADHD Task Manager - A specialized task management app designed for individuals with ADHD. Features include Pomodoro timer, task prioritization, focus mode, and detailed analytics.',
  keywords: 'ADHD, task manager, productivity, focus, Pomodoro timer, time management, executive function, attention deficit, hyperactivity disorder, productivity app',
  image: '/og-image.png',
  url: 'https://adhd-task-manager.app',
  type: 'website' as const,
  author: 'ADHD Task Manager Team',
  locale: 'en_US',
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  locale,
  alternateLocales = [],
  canonicalUrl,
  noindex = false,
  nofollow = false,
}) => {
  const meta = {
    title: title ? `${title} | ADHD Task Manager` : defaultMeta.title,
    description: description || defaultMeta.description,
    keywords: keywords || defaultMeta.keywords,
    image: image || defaultMeta.image,
    url: url || defaultMeta.url,
    type,
    author: author || defaultMeta.author,
    locale: locale || defaultMeta.locale,
  };

  const fullImageUrl = meta.image.startsWith('http') 
    ? meta.image 
    : `${defaultMeta.url}${meta.image}`;

  const robotsContent = `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`;

  // Structured Data for Organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ADHD Task Manager',
    url: defaultMeta.url,
    logo: `${defaultMeta.url}/logo512.png`,
    sameAs: [
      'https://twitter.com/ADHDTaskManager',
      'https://www.facebook.com/ADHDTaskManager',
      'https://www.linkedin.com/company/adhd-task-manager'
    ]
  };

  // Structured Data for WebApplication
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ADHD Task Manager',
    description: defaultMeta.description,
    url: defaultMeta.url,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1024'
    },
    screenshot: [
      `${defaultMeta.url}/screenshots/dashboard.png`,
      `${defaultMeta.url}/screenshots/tasks.png`,
      `${defaultMeta.url}/screenshots/timer.png`
    ],
    featureList: [
      'Task Management',
      'Pomodoro Timer',
      'Focus Mode',
      'Analytics Dashboard',
      'Notification Reminders',
      'Dark Mode',
      'Multi-language Support',
      'Offline Functionality'
    ]
  };

  // Structured Data for Article (if type is article)
  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    image: fullImageUrl,
    author: {
      '@type': 'Person',
      name: meta.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'ADHD Task Manager',
      logo: {
        '@type': 'ImageObject',
        url: `${defaultMeta.url}/logo512.png`
      }
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': meta.url
    }
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content={meta.author} />
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta charSet="utf-8" />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Alternate Languages */}
      {alternateLocales.map((altLocale) => (
        <link
          key={altLocale}
          rel="alternate"
          hrefLang={altLocale}
          href={`${meta.url}/${altLocale}`}
        />
      ))}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content={meta.type} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:alt" content={meta.title} />
      <meta property="og:site_name" content="ADHD Task Manager" />
      <meta property="og:locale" content={meta.locale} />
      
      {type === 'article' && (
        <>
          <meta property="article:author" content={meta.author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ADHDTaskManager" />
      <meta name="twitter:creator" content="@ADHDTaskManager" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={meta.title} />
      
      {/* Mobile App Meta Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="ADHD Tasks" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#667eea" />
      
      {/* Microsoft Tiles */}
      <meta name="msapplication-TileColor" content="#667eea" />
      <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Verification Tags */}
      {process.env.REACT_APP_GOOGLE_SITE_VERIFICATION && (
        <meta name="google-site-verification" content={process.env.REACT_APP_GOOGLE_SITE_VERIFICATION} />
      )}
      {process.env.REACT_APP_BING_SITE_VERIFICATION && (
        <meta name="msvalidate.01" content={process.env.REACT_APP_BING_SITE_VERIFICATION} />
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webAppSchema)}
      </script>
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {process.env.REACT_APP_API_URL && (
        <link rel="preconnect" href={process.env.REACT_APP_API_URL} />
      )}
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      
      {/* Prefetch important resources */}
      <link rel="prefetch" href="/manifest.json" />
      
      {/* Additional SEO Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="rating" content="General" />
      <meta name="distribution" content="Global" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};