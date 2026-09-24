import clsx from 'clsx';
import Heading from '@theme/Heading';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

type FeatureItem = {
  title: JSX.Element;
  imgName: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: (
      <Translate id="homepage.feature.writesEnglish">
        Writes in English
      </Translate>
    ),
    imgName: 'cat-work.png',
  },
  {
    title: (
      <Translate id="homepage.feature.ownsDocsPlatform">
        Owns a docs platform
      </Translate>
    ),
    imgName: 'cat-pipe.png',
  },
  {
    title: (
      <Translate id="homepage.feature.hasPortfolio">
        Has a portfolio
      </Translate>
    ),
    imgName: 'cat-portfolio.png',
  },
  {
    title: (
      <Translate id="homepage.feature.readyForTeam">
        Is ready for a new team
      </Translate>
    ),
    imgName: 'cat-job.png',
  },
];

function Feature({title, imgName}: FeatureItem) {
  return (
    <div className={clsx('col')}>
      <div className="text--center">
        <img
          src={require('@site/static/img/' + imgName).default}
          className={styles.featureSvg}
          alt=""
        />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
