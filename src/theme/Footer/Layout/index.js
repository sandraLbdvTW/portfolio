import React from 'react';
import clsx from 'clsx';
import styles from "@site/src/pages/index.module.css";
export default function FooterLayout({style, links, logo, copyright}) {
  return (
    <footer
      className={clsx('footer', {
        'footer--dark': style === 'dark',
      })}>
      <div className="container container-fluid">
        {links}
        {(logo || copyright) && (
          <div className="footer__bottom text--center">
            {logo && <div className="margin-bottom--sm">{logo}</div>}
            {copyright}
          </div>
        )}
      </div>
      <div className={styles.copyright}>
        Illustrations:&nbsp;<a href="https://icons8.com/">Icons8</a>
      </div>
    </footer>
  );
}
