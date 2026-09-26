import { setCellPriority, setCellStatus } from "../actions";
import type { MatrixCell } from "../queries";
import { CellControls } from "./cell-controls";

/**
 * The cells themselves. Admins can reprioritise (1 is selected first) and retire or reopen a cell;
 * cells the pipeline has taken (queued / drafted / published) can't be toggled.
 */
export function MatrixCells({ cells, canEdit }: { cells: MatrixCell[]; canEdit: boolean }) {
  if (cells.length === 0) {
    return <p className="border-y border-line py-12 text-ink-muted">No cells match.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-subtle text-xs text-ink-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              Target query
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Angle · audience · format
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              Status
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold">
              {canEdit ? "Priority / action" : "Priority"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {cells.map((cell) => {
            const toggleable = cell.status === "open" || cell.status === "exhausted";
            return (
              <tr key={cell.id}>
                <td className="px-4 py-2">
                  <p className="font-semibold">{cell.target_query}</p>
                  <p className="text-xs text-ink-muted">
                    {cell.category.name} · {cell.subtopic}
                  </p>
                </td>
                <td className="px-4 py-2 text-xs text-ink-muted">
                  {cell.angle} · {cell.audience} · {cell.format}
                </td>
                <td className="px-4 py-2 capitalize">{cell.status}</td>
                <td className="px-4 py-2">
                  {canEdit ? (
                    <CellControls
                      status={cell.status}
                      priority={cell.priority}
                      toggle={
                        toggleable
                          ? setCellStatus.bind(
                              null,
                              cell.id,
                              cell.status === "open" ? "exhausted" : "open",
                            )
                          : null
                      }
                      prioritise={setCellPriority.bind(null, cell.id)}
                    />
                  ) : (
                    <p className="tabular text-right">P{cell.priority}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
