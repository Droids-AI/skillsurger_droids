// Official, free learning sources used to fill skills the generated path misses,
// plus filters for generated links that are not real learning resources.
// Every URL here was checked to load (HTTP 200) on 12 Oct 2026.

export interface CuratedResource {
  type: string;
  title: string;
  description: string;
  url: string;
  provider: string;
  price: 'free';
  difficulty?: undefined;
  lastVerified?: string;
  verified: false;
  curated: true;
}

interface SkillSource {
  match: RegExp;
  title: string;
  description: string;
  url: string;
  provider: string;
}

const guide = (match: RegExp, title: string, description: string, url: string, provider: string): SkillSource =>
  ({ match, title, description, url, provider });

// Order matters only for display; matching is per skill.
const SKILL_SOURCES: SkillSource[] = [
  guide(/\bpython\b/i, 'The Python Tutorial', 'The official Python tutorial covering syntax, data structures, modules, errors and classes.', 'https://docs.python.org/3/tutorial/', 'python.org'),
  guide(/\bjava\b(?!\s*script)/i, 'Learn Java', "Oracle's official Java learning path, from first program to language features and the JDK tools.", 'https://dev.java/learn/', 'dev.java (Oracle)'),
  guide(/\b(sql|mysql|postgres(ql)?|sqlite|t-?sql|pl\/sql)\b/i, 'SQLBolt: Interactive SQL Lessons', 'Free interactive lessons on SELECT queries, joins, aggregates and changing data.', 'https://sqlbolt.com/', 'SQLBolt'),
  guide(/\bdocker\b|\bcontaineri[sz]/i, 'Docker: Get Started', 'Official Docker guide to images, containers, Dockerfiles and Compose.', 'https://docs.docker.com/get-started/', 'Docker Docs'),
  guide(/\brest(ful)?\b|\bhttp\b|\bapis?\b/i, 'An Overview of HTTP', 'MDN guide to how HTTP requests, responses, methods and status codes work, the basis of REST APIs.', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview', 'MDN Web Docs'),
  guide(/\bjavascript\b|\bjs\b|\becmascript\b/i, 'JavaScript: Dynamic Client-Side Scripting', 'MDN learning module on JavaScript fundamentals.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting', 'MDN Web Docs'),
  guide(/\btypescript\b|\bts\b/i, 'The TypeScript Handbook', 'Official TypeScript handbook covering types, narrowing, generics and modules.', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'typescriptlang.org'),
  guide(/\breact(\.js|js)?\b/i, 'Learn React', 'The official React tutorial and guides on components, state and effects.', 'https://react.dev/learn', 'react.dev'),
  guide(/\bnode(\.js|js)?\b/i, 'Introduction to Node.js', 'Official Node.js learning guide.', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'nodejs.org'),
  guide(/\bgit(hub)?\b|\bversion control\b/i, 'Pro Git', 'The free official Git book, from basics to branching and collaboration.', 'https://git-scm.com/book/en/v2', 'git-scm.com'),
  guide(/\bgithub actions\b|\bci\s*\/?\s*cd\b/i, 'GitHub Actions Quickstart', 'Official guide to building a first CI/CD workflow with GitHub Actions.', 'https://docs.github.com/en/actions/get-started/quickstart', 'GitHub Docs'),
  guide(/\bkubernetes\b|\bk8s\b/i, 'Learn Kubernetes Basics', 'Official interactive Kubernetes tutorial: deploy, expose, scale and update an app.', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'kubernetes.io'),
  guide(/\baws\b|\bamazon web services\b/i, 'AWS Skill Builder', "AWS's official training site, with many free digital courses.", 'https://skillbuilder.aws/', 'AWS'),
  guide(/\bazure\b/i, 'Azure Training', 'Microsoft Learn training paths for Azure.', 'https://learn.microsoft.com/en-us/training/azure/', 'Microsoft Learn'),
  guide(/\bgcp\b|\bgoogle cloud\b/i, 'Google Cloud Training', 'Official Google Cloud learning paths and labs.', 'https://cloud.google.com/learn/training', 'Google Cloud'),
  guide(/\bterraform\b|\binfrastructure as code\b/i, 'Terraform Tutorials', 'Official HashiCorp tutorials for Terraform.', 'https://developer.hashicorp.com/terraform/tutorials', 'HashiCorp'),
  guide(/\bspring( boot)?\b/i, 'Building an Application with Spring Boot', 'Official Spring guide to creating a Spring Boot application.', 'https://spring.io/guides/gs/spring-boot', 'spring.io'),
  guide(/\bgolang\b|\bgo (language|programming)\b|^go$/i, 'A Tour of Go', 'The official interactive introduction to Go.', 'https://go.dev/tour/', 'go.dev'),
  guide(/\bc\+\+|\bcpp\b/i, 'LearnCpp.com', 'Free, comprehensive C++ tutorial site.', 'https://www.learncpp.com/', 'LearnCpp.com'),
  guide(/\bc#|\bcsharp\b|\.net\b/i, 'A Tour of the C# Language', 'Official Microsoft introduction to C#.', 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/', 'Microsoft Learn'),
  guide(/\bkotlin\b/i, 'Get Started with Kotlin', 'Official Kotlin getting-started guide.', 'https://kotlinlang.org/docs/getting-started.html', 'kotlinlang.org'),
  guide(/\brust\b/i, 'The Rust Programming Language', 'The official Rust book.', 'https://doc.rust-lang.org/book/', 'rust-lang.org'),
  guide(/\bhtml\b/i, 'Structuring Content with HTML', 'MDN learning module on HTML.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content', 'MDN Web Docs'),
  guide(/\bcss\b|\btailwind\b/i, 'CSS Styling Basics', 'MDN learning module on CSS.', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics', 'MDN Web Docs'),
  guide(/\bangular\b/i, 'Angular Tutorials', 'Official Angular tutorials.', 'https://angular.dev/tutorials', 'angular.dev'),
  guide(/\bvue(\.js|js)?\b/i, 'Vue Tutorial', 'Official interactive Vue tutorial.', 'https://vuejs.org/tutorial/', 'vuejs.org'),
  guide(/\bdjango\b/i, 'Writing Your First Django App', 'Official Django tutorial.', 'https://docs.djangoproject.com/en/stable/intro/tutorial01/', 'djangoproject.com'),
  guide(/\bfastapi\b/i, 'FastAPI Tutorial', 'Official FastAPI user guide.', 'https://fastapi.tiangolo.com/tutorial/', 'fastapi.tiangolo.com'),
  guide(/\bgraphql\b/i, 'Learn GraphQL', 'Official introduction to GraphQL queries, schemas and types.', 'https://graphql.org/learn/', 'graphql.org'),
  guide(/\bmongo(db)?\b/i, 'Getting Started with MongoDB', 'Official MongoDB getting-started tutorial.', 'https://www.mongodb.com/docs/manual/tutorial/getting-started/', 'MongoDB Docs'),
  guide(/\bredis\b/i, 'Redis Learn', 'Official Redis tutorials and courses.', 'https://redis.io/learn', 'redis.io'),
  guide(/\bkafka\b/i, 'Apache Kafka Quickstart', 'Official Kafka quickstart.', 'https://kafka.apache.org/quickstart', 'kafka.apache.org'),
  guide(/\bpandas\b|\bdata analysis\b/i, 'Getting Started with pandas', 'Official pandas getting-started guides.', 'https://pandas.pydata.org/docs/getting_started/index.html', 'pandas.pydata.org'),
  guide(/\bmachine learning\b|\bml\b/i, 'Machine Learning Crash Course', "Google's free machine learning course.", 'https://developers.google.com/machine-learning/crash-course', 'Google for Developers'),
  guide(/\btensorflow\b/i, 'TensorFlow Tutorials', 'Official TensorFlow tutorials.', 'https://www.tensorflow.org/tutorials', 'tensorflow.org'),
  guide(/\bpytorch\b|\bdeep learning\b/i, 'PyTorch Tutorials', 'Official PyTorch tutorials.', 'https://pytorch.org/tutorials/', 'pytorch.org'),
  guide(/\bselenium\b|\btest automation\b/i, 'Getting Started with WebDriver', 'Official Selenium WebDriver guide.', 'https://www.selenium.dev/documentation/webdriver/getting_started/', 'selenium.dev'),
];

function sourceFor(skill: string): SkillSource | undefined {
  return SKILL_SOURCES.find(source => source.match.test(skill));
}

function toResource(source: SkillSource): CuratedResource {
  return {
    type: 'Official guide',
    title: source.title,
    description: source.description,
    url: source.url,
    provider: source.provider,
    price: 'free',
    verified: false,
    curated: true,
  };
}

// Links that are not a learning resource a user can open: listicles, search pages,
// private enterprise catalogues and non-HTTPS links.
export function isUsableResourceLink(resource: { title?: string; url?: string }): boolean {
  const title = resource.title || '';
  let url: URL;
  try { url = new URL(resource.url || ''); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  if (/\b(best|top)\s+(\d+\s+)?[\w\s-]{0,30}\b(courses|tutorials|resources|classes|books)\b/i.test(title)) return false;
  if (/\/(best|top)-[\w-]*(courses|tutorials|classes)/i.test(url.pathname)) return false;
  if (/\/(search|results)\b/i.test(url.pathname) || url.searchParams.has('search_query')) return false;
  if (/(^|\.)coursera\.org$/i.test(url.hostname) && url.pathname.startsWith('/programs/')) return false;
  return true;
}

function covers(resource: { title?: string; description?: string }, source: SkillSource): boolean {
  return source.match.test(`${resource.title || ''} ${resource.description || ''}`);
}

/**
 * Drops unusable generated links, then adds one official guide for each required
 * skill no remaining resource covers. Curated guides go first per skill order.
 */
export function completeLearningResources<T extends { title?: string; description?: string; url?: string }>(
  resources: T[],
  skills: string[],
): Array<T | CuratedResource> {
  const usable = resources.filter(isUsableResourceLink);
  const added: CuratedResource[] = [];
  const seen = new Set(usable.map(resource => resource.url));
  for (const skill of skills) {
    const source = sourceFor(skill);
    if (!source || seen.has(source.url)) continue;
    if (usable.some(resource => covers(resource, source))) continue;
    seen.add(source.url);
    added.push(toResource(source));
  }
  return [...usable, ...added];
}
