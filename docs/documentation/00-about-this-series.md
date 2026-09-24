---
slug: /
sidebar_position: 1
description: The real project behind these articles, what their author owns, and how to read the series.
---

# About this series: documentation for a real Antora platform

The articles in this section document a docs-as-code platform: a multi-repository Antora site where a team of nine technical writers writes, reviews, and publishes versioned product documentation.
The platform is real—I designed it, built its tooling, and maintain it at my employer.

The articles aren't a case study, though. Each one is a genuine piece of technical documentation, written for its own reader and readable on its own. Together they show both the platform and how I write about it.

## What I own

My employer hired me to move its documentation from Microsoft Word to docs-as-code. I gathered the business and team requirements, made the case for a single documentation site, selected Antora, and designed the platform and the writing, review, and publishing workflow.

I guided the team through the transition: I prepared training and step-by-step guides, helped the writers learn Git, and supported their first merge requests. I wrote the editorial standards and a guide for authors. Today I maintain these rules, review content, and help colleagues work through complex tasks.

On the platform, I own the repository structure, the branching and versioning model, the central build, and CI/CD.

I reworked Antora's default UI bundle and built tools that select versions at build time, optimize images, and produce PDFs. I set up automated checks for style, links, and the build. I keep developing the platform based on the team's feedback: I look into day-to-day difficulties and simplify repetitive tasks.

Server provisioning and deployment are the work of DevOps colleagues, so the articles leave them out.

## How to read the articles

The articles anonymize everything product-specific: they document a fictional product, Red Apple Conference, and use example hosts such as `git.example.com`.

The examples are simplified: configuration samples show up to four content repositories, while the real platform assembles more than 15. Some project-specific details are deliberately omitted, but the mechanisms are the ones in production.

Each article is a different document type with its own reader.
Read the one that matches your question.

- **[How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md)**—an explanation for a documentation lead evaluating Antora.
  It maps the whole platform: content repositories, the UI bundle, the central playbook, and the staging/production split.
  Read it first if the architecture is new to you.

- **[Version your documentation with Antora branches](02-antora-versioning-tutorial.md)**—a tutorial for a writer new to Antora.
  Branch-as-version is the model the team works in daily; the tutorial rebuilds it from scratch.

- **[Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md)**—a how-to for a docs engineer with an Antora build in GitLab CI.
  On the real platform, its own web host serves the previews, and reviewers read them along with raw diffs.
  The how-to shows the same workflow with previews served from CI artifacts, so you can reproduce it on any GitLab tier without hosting of your own.
