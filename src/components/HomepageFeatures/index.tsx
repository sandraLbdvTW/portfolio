import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  imgName: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Writes in English',
    imgName: 'cat-work.png',
  },
  {
    title: 'Owns a docs platform',
    imgName: 'cat-pipe.png',
  },
  {
    title: 'Has a portfolio',
    imgName: 'cat-portfolio.png',
  },
  {
    title: 'Is ready for a new team',
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
