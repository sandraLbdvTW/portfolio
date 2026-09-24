import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Translate, {translate} from '@docusaurus/Translate';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          <Translate id="homepage.hero.name">Aleksandra Lebedeva</Translate>
        </Heading>
        <p className="hero__subtitle">
          <Translate id="homepage.hero.tagline">Writes documentation</Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            <Translate
              id="homepage.hero.cta"
              description="Call-to-action button on the homepage">
              What kind?
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title={translate({
        id: 'homepage.meta.title',
        message: 'Technical writing portfolio',
        description: 'Homepage browser title',
      })}
      description={translate({
        id: 'homepage.meta.description',
        message: 'Technical writing portfolio of Aleksandra Lebedeva',
        description: 'Homepage meta description',
      })}>
      <HomepageHeader />
      <main>
        <HomepageFeatures/>
      </main>
    </Layout>
  );
}
