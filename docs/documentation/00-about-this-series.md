---
slug: /
sidebar_position: 1
description: The real project behind these articles, what their author owned, and how to read the series.
---

# About this series: documentation for a real Antora platform

The articles in this section document a docs-as-code platform: a multi-repository Antora site where a team of nine technical writers writes, reviews, and publishes versioned product documentation.
The platform is real—I designed it, built its tooling, and maintain it at my employer.

The articles aren't a case study, though. Each one is a genuine piece of technical documentation, written for its own reader and readable on its own. Together they show both the platform and how I write about it.

## What I owned

I gathered the team's requirements, selected Antora, and designed the writing, review, and publishing workflow, then moved the team from Microsoft Word to Git and trained the writers.

On the platform itself I own the branching and versioning model and the GitLab CI of all repositories, including the per-merge-request preview environments.

I also reworked the site's UI bundle from Antora's default and built a few internal tools for the team.

Server provisioning and deployment are the work of DevOps colleagues, so the articles leave them out.

## How to read the articles

The articles anonymize everything product-specific: they document a fictional product, Red Apple Conference, on example hosts such as `git.example.com`.

The examples are simplified: configuration samples show two or three content repositories where the real platform assembles about 15, and some project-specific detail is deliberately omitted, but the mechanisms are the ones in production.

Each article is a different document type with its own reader.
Read the one that matches your question.

- **[How a multi-repository Antora documentation platform fits together](01-antora-multi-repo-platform.md)**—an explanation for a documentation lead evaluating Antora.
  It maps the whole platform: content repositories, the UI bundle, the central playbook, and the staging/production split.
  Read it first if the architecture is new to you.

- **[Version your documentation with Antora branches](02-antora-versioning-tutorial.md)**—a tutorial for a writer new to Antora.
  Branch-as-version is the model the team works in daily; the tutorial rebuilds it from scratch.

- **[Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md)**—a how-to for a docs engineer with an Antora build in GitLab CI.
  On the real platform, reviewers read these previews along with raw diffs, served from the platform's own web host.
  The how-to shows the same workflow with previews served from CI artifacts, so you can reproduce it on any GitLab tier without hosting of your own.
