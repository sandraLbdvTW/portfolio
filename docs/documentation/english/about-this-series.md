---
sidebar_position: 1
description: The real project behind these articles, what their author owned, and how to read the series.
---

# About this series: documentation for a real Antora platform

The five articles in this section document a docs-as-code platform: a multi-repository Antora site where a team of nine technical writers writes, reviews, and publishes versioned product documentation.
The platform is real—I designed it, built its tooling, and maintain it at my employer.
The articles aren't a case study, though.
Each one is a genuine piece of technical documentation, written for its own reader and readable on its own; this page only supplies the shared context.

## What I owned

I gathered the team's requirements, selected Antora, and designed the writing, review, and publishing workflow, then moved the team from Microsoft Word to Git and trained the writers.
On the platform itself I own the branching and versioning model with its version-selector script, and the GitLab CI of all content repositories, including the per-merge-request preview environments.
I also reworked the site's UI bundle from Antora's default.
Day to day, I run the site, including incident triage.

Server provisioning and deployment (the hosts, the web server, and the delivery of builds onto them) are the work of DevOps colleagues, so the articles leave them out.

## How to read the articles

The articles anonymize everything product-specific: they document a fictional product, Red Apple Conference, on example hosts such as `git.example.com`.
Configuration samples show two or three content repositories where the real platform assembles about 15, but the mechanisms they show are the ones in production.

Each article is a different document type with its own reader.
Read the one that matches your question; the articles cross-link where they connect.

- **[How a multi-repository Antora documentation platform fits together](antora-multi-repo-platform.md)**—an explanation for a documentation lead evaluating Antora.
  It maps the whole platform: content repositories, the UI bundle, the central playbook, and the staging/production split.
  Read it first if the architecture is new to you.

- **[Version your documentation with Antora branches](antora-versioning-tutorial.md)**—a tutorial for a writer new to Antora.
  Branch-as-version is the model the team works in daily; the tutorial rebuilds it from scratch, down to a minimal version of the platform's version-selector script.

- **[Set up per-merge-request preview environments with GitLab Review Apps](gitlab-review-apps-previews.md)**—a how-to for a docs engineer with an Antora build in GitLab CI.
  On the real platform, reviewers read these previews instead of raw diffs; the how-to extracts the setup for your own project.

- **[GitLab CI pipeline for an Antora documentation repository: a reference](gitlab-ci-pipeline-reference.md)**—a reference for a maintainer extending or debugging the pipeline.
  Every content repository runs this same pipeline; the reference documents it job by job, the way I'd want it documented for the maintainer after me.

- **[A branching and merge-request workflow for a documentation team](docs-team-branching-workflow.md)**—an explanation of a policy for a documentation lead designing a Git workflow.
  It's the team's day-to-day working agreement, documented here with the rationale behind each rule.
