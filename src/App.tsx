import useResizeObserver from "use-resize-observer";
import { FixedSizeGrid as Grid } from "react-window";
import { HTMLAttributes, ReactNode, useState } from "react";
import {
  DragOverlay,
  DndContext,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext } from "@dnd-kit/sortable";
import { GridChildComponentProps } from "react-window";

function backgroundForId(id: string) {
  return `hsl(${120 + (+id * 30 - 15)}deg, 20%, var(--lightness, 50%))`;
}

function Item(props: { value: string; isOverlay?: boolean }) {
  return (
    <div
      style={{
        aspectRatio: "2/3",
        color: "#222",
        padding: "1rem",
        display: "grid",
        placeItems: "center",
        ...(props.isOverlay && {
          background: backgroundForId(props.value),
          filter: "brightness(1.25)",
          transform: "scale(0.95)",
        }),
      }}
    >
      {props.value}
    </div>
  );
}

function Sortable(props: { children: ReactNode; id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    newIndex,
    index,
    over,
    isSorting,
  } = useSortable({
    id: props.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        touchAction: "none",
        background: backgroundForId(props.id),
        transformOrigin: "bottom",
        transitionDuration: isSorting ? "100ms" : undefined,
        transitionTimingFunction: "ease-in-out",
        transitionProperty: isSorting
          ? "transform filter background"
          : undefined,
        ...(isDragging
          ? {
              filter: over ? "opacity(0)" : undefined,
              transform: "scale(0.95)",
              "--lightness": "60%",
            }
          : index !== newIndex
          ? {
              transform: `scale(0.85) ${
                newIndex < index
                  ? "translateX(-100%) rotate(-5deg)"
                  : "translateX(100%) rotate(5deg)"
              }`,
              opacity: "0.8",
              "--lightness": "30%",
            }
          : null),
      }}
    >
      {props.children}
    </div>
  );
}

function App() {
  const [items, setItems] = useState(() =>
    Array(10000)
      .fill(0)
      .map((_, i) => "" + i)
  );
  const [activeItem, setActiveItem] = useState<string | null>(null);

  function handleDragStart(dragStart: DragStartEvent) {
    setActiveItem(dragStart.active.id as string);
    console.log("drag started:", dragStart.active.id);
  }
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const newItems = items.slice();
        const [oldValue] = newItems.splice(
          items.indexOf(active.id as string),
          1
        );
        newItems.splice(items.indexOf(over.id as string), 0, oldValue);
        return newItems;
      });
    }
    setActiveItem(null);
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={items}>
        <ResizerDiv
          style={{
            border: "0.25rem solid #555",
            borderRadius: "0.5rem",
            background: "#333",
            padding: "2rem 1rem",
            minHeight: "100vh",
          }}
        >
          {(width, height) => {
            const [cellWidth, cellHeight] =
              width < 768 ? [100, 150] : [200, 300];
            const columns = Math.floor(width / cellWidth);
            const rows = columns ? Math.ceil(items.length / columns) : 0;
            return (
              <Grid
                width={width - (width % cellWidth)}
                height={height}
                columnWidth={cellWidth}
                rowHeight={cellHeight}
                rowCount={rows}
                columnCount={columns}
                itemKey={(index) =>
                  items[index.columnIndex + index.rowIndex * columns]
                }
                itemData={{ columns, rows, items }}
                style={{
                  marginInline: "auto",
                }}
              >
                {GridCell}
              </Grid>
            );
          }}
        </ResizerDiv>
      </SortableContext>
      <DragOverlay>
        {activeItem ? <Item value={activeItem} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function ResizerDiv({
  children,
  ...otherProps
}: Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: (width: number, height: number) => ReactNode;
}) {
  const { ref, width = 0, height = 0 } = useResizeObserver();
  return (
    <div ref={ref} {...otherProps}>
      {children(width, height)}
    </div>
  );
}

export default App;

// {items.map((item) => (
//   <Sortable key={item} id={item}>
//     <Item value={item} />
//   </Sortable>
// ))}
//
function GridCell(
  props: GridChildComponentProps<{
    columns: number;
    rows: number;
    items: string[];
  }>
) {
  const item =
    props.data.items[props.columnIndex + props.rowIndex * props.data.columns];
  return item ? (
    <div
      style={{
        ...props.style,
        padding: "0.5rem",
      }}
    >
      <Sortable id={item}>
        <Item value={item} />
      </Sortable>
    </div>
  ) : null;
}
