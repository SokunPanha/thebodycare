// Posts: reading, rendering and editing articles.
// Public surface of this feature. Import from "@/features/posts", never a deep path. (STRUCTURE.md rule 2)
export { getArticle, getPublishedPost, type Article } from "./article";
export { ArticleView } from "./components/article-view";
export { LeadPost } from "./components/lead-post";
export { PostIndex } from "./components/post-index";
export {
  getPostBySlug,
  listByCategory,
  listPublished,
  listPublishedSlugs,
  listRelatedPosts,
  POSTS_PAGE_SIZE,
  type Page,
  type PostListing,
  type PostWithSources,
} from "./queries";
