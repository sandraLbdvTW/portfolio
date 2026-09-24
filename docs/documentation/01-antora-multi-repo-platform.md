---
description: How content repositories, a UI bundle, and a central playbook combine into one versioned documentation site.
---

# How a multi-repository Antora documentation platform fits together

A multi-repository Antora platform builds one documentation site from many Git repositories.
Each product component keeps its documentation in its own repository.
A central build assembles the components into a single site with shared navigation, search, design, and a version selector for every component.

This article is for technical writers and documentation leads who are evaluating Antora for a product with many components.
After reading it, you can identify the parts of such a platform and decide whether the architecture fits your product.
This article focuses on the platform architecture.
For complete details on Antora and playbook configuration, see the [official Antora documentation](https://docs.antora.org).

## One product, many components, one site

This article uses a fictional product, Red Apple Conference, modeled on a real platform.
It ships a server, a web client, mobile clients, and several more components, each with its own release cycle and version numbers.
Readers expect a single site with one address, one search box, and documentation that matches the component version they run.

A single documentation repository makes independent versioning difficult.
Every Git branch contains the documentation for all components, even though the components are released separately.
Giving each component its own documentation site solves this problem but fragments the reader experience: search stops at component boundaries, and the sites' designs drift apart.

Antora solves this problem at the architecture level.
Content lives in as many repositories as you need, and one central build assembles it into a single site.
The real-world platform behind this series assembles content from more than 15 repositories.
The examples in this article use four.

## Key terms

The series uses standard Antora terminology:

| Term | Meaning                                                                                                                                       |
|---|-----------------------------------------------------------------------------------------------------------------------------------------------|
| Component | One documentation unit, typically matching one product component. Defined by an `antora.yml` file in its repository.                          |
| Version | One version of a component. Antora treats each Git branch or tag listed in the playbook as a version.                                         |
| Module | A directory that groups pages inside a component. Every component has at least one module.                                                    |
| Playbook | The YAML file that configures a site build: which content repositories and branches to collect, which UI to apply, where to write the output. |
| UI bundle | A zip archive with the site's templates, styles, and scripts. Antora applies it to every page at build time.                                  |

## The moving parts

The platform consists of three kinds of repositories, each with one job:

```mermaid
graph LR
    subgraph Content repositories
        A["docs-server<br/>(branches: v1.0, v1.1, main)"]
        B["docs-client-web<br/>(branches: v2.3, v2.4, main)"]
        C["docs-homepage<br/>(branches: dev, main)"]
        G["docs-blog<br/>(branches: dev, main)"]
    end
    subgraph UI repository
        D["docs-ui<br/>→ ui-bundle.zip"]
    end
    subgraph Playbook repository
        E["docs-playbook<br/>playbook + build scripts"]
    end
    A --> E
    B --> E
    C --> E
    G --> E
    D --> E
    E --> F["Static site<br/>(one HTML tree)"]
```

### Content repositories

Each product component keeps its documentation in its own repository, for example `docs-server`, `docs-client-web`, and `docs-client-ios`.

A repository contains AsciiDoc pages, images, and an `antora.yml` descriptor that names the component and its version.
Branches carry the versions: each `v*` branch listed in the playbook becomes one entry in the site's version selector.

The central site is only one consumer of these repositories.
Each repository is a complete Antora component, so a pipeline can also build it on its own.
Red Apple Conference relies on this independence: the product ships one component's documentation as built-in help.
The component's own pipeline builds this help with the same UI bundle and a few product-specific style overrides.

Two content repositories work differently.
The site homepage and the blog live in the `docs-homepage` and `docs-blog` repositories and use their own page layouts from the shared UI bundle.
They have no versions: instead of `v*` branches, each has a `dev` branch for the staging site and a `main` branch for the production site.

### The UI repository

A single repository, `docs-ui`, owns the site's look.

Antora's default UI already provides the page layout, navigation, and the component version selector.
This repository is a customized copy of the default UI, adapted to the product.
Its continuous integration (CI) pipeline builds the theme into one artifact, `ui-bundle.zip`.
Every site build applies this bundle to every page, which keeps all product components visually identical.

### The playbook repository

The central repository, `docs-playbook`, is where a site build starts.
It holds no documentation content—only the playbook files and build scripts.
The playbook tells Antora what to assemble.

Here is a shortened production playbook with four sources:

```yaml
site:
  title: Red Apple Conference Documentation
  url: https://docs.example.com
content:
  branches: [v*]
  sources:
    - url: https://git.example.com/docs/docs-server
    - url: https://git.example.com/docs/docs-client-web
    - url: https://git.example.com/docs/docs-homepage
      branches: [main]
    - url: https://git.example.com/docs/docs-blog
      branches: [main]
ui:
  bundle:
    url: ./build/ui-bundle.zip
antora:
  extensions:
    - require: '@antora/lunr-extension'
      languages: [en]
      index_latest_only: true
```

The top-level `content.branches: [v*]` applies to the versioned components.
The `docs-homepage` and `docs-blog` sources override it with `branches: [main]`, because the production site publishes the homepage and the blog from `main`.

The `content.sources` list is the central piece of configuration.
To add a component to the site, you add a line with one new `url` entry.

## How a build assembles the site

A full site build always starts in the playbook repository, in CI or locally.

1. Antora reads the playbook and fetches every source.
   For each repository it collects the listed branches; each branch becomes one version of that component, named by the `antora.yml` descriptor on that branch.
2. Antora applies the UI bundle, and the Lunr extension builds the search index.
   Every page gets the same templates and styles, and the index covers the latest version of each component.
   Searches run in the reader's browser, so the site needs no search server.
3. The result lands in one output directory, `build/site` by default.
   The site is a plain static HTML tree, so any static file host can serve it.

The playbook builds branches that match `v*`.
So a new `v*` branch in a component repository automatically becomes a new documentation version at the next build.
You don't need to change the platform configuration.

Pages can also link across components without hard-coded URLs.
A page in `docs-server` references a page in `docs-client-web` by Antora page ID, using the `xref` macro.
Antora resolves every page ID to a URL at build time.

## Development and production builds

The platform builds two variants of the site from two playbooks: `antora-playbook.dev.yml` and `antora-playbook.prod.yml`.
The dev build publishes the staging site, where the team reviews work in progress.
The prod build publishes the production site, which readers see.

The playbooks differ only where the two environments must differ, for example:

| Setting | Dev | Prod |
|---|---|---|
| `site.url` | `https://docs-staging.example.com` | `https://docs.example.com` |
| Product component branches | `main` and `v*` | `v*` only |
| UI bundle | built from the UI repo's `dev` branch | built from the UI repo's `main` branch |
| Analytics | off | on |

The branch difference is the one that matters most.
The staging site includes every product component's `main` branch, so writers see unreleased documentation next to released versions.
For product components, the production site collects only `v*` branches, so no unreleased documentation reaches readers.

Keeping two playbooks instead of one parameterized file is a deliberate trade-off.
This way, each file clearly shows all settings of its site.
But shared changes, such as a new content source, go into both files.

## Where automation fits

Two main pieces of automation keep the platform running.

Content repositories trigger the central build.
A pipeline in each content repository validates the component and then triggers the playbook repository: a push to `main` rebuilds the staging site, and a push to a version branch, such as `v1.1`, rebuilds staging and production.

Merge requests get previews.
Every merge request in a content repository deploys its own temporary preview environment, linked from the merge request, and the preview expires automatically.
The how-to [Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md) shows the setup.

## When this architecture is worth it

The architecture is worth its complexity when three conditions are true:

1. Your product has several independently versioned components.
2. Readers need them on one site.
3. Someone can own the central infrastructure: the playbook repository, the UI bundle, and the CI that connects them.

It's the wrong choice for a single-component product, where plain single-repository Antora or a simpler generator does the job with none of the coordination cost.
It's also questionable if all components release in lockstep: one repository with one set of version branches is easier to operate.

## Next steps

- [Version your documentation with Antora branches](02-antora-versioning-tutorial.md): follow a hands-on tutorial to build a two-version site with a version selector.
- [Set up per-merge-request preview environments with GitLab Review Apps](03-gitlab-review-apps-previews.md): add preview links to your merge requests.
