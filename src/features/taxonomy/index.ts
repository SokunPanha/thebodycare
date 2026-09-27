// Taxonomy: categories and the topic matrix.
// Public surface of this feature. Import from "@/features/taxonomy", never a deep path. (STRUCTURE.md rule 2)
export { MatrixCells } from "./components/matrix-cells";
export { MatrixCoverage } from "./components/matrix-coverage";
export { TopicGrid } from "./components/topic-grid";
export { TopicIcon } from "./components/topic-icon";
export { TopicRow } from "./components/topic-row";
export {
  getCategoryBySlug,
  listCategories,
  getMatrixCoverage,
  listCategoriesWithCounts,
  listMatrixCells,
  MATRIX_STATUSES,
  type CategoryCoverage,
  type MatrixCell,
  type MatrixStatus,
  type Category,
  type CategoryWithCount,
} from "./queries";
