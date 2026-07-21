import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './KanbanBoard.css';

function SortableItem({ id, content }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="kanban-item">
      <div className="kanban-item-content">{content}</div>
    </div>
  );
}

function SubLane({ subLaneId, parentId, displayTitle, isOver, highlight }) {
  const uniqueId = `sublane_${parentId}_${subLaneId}`;
  const { setNodeRef } = useDroppable({ id: uniqueId });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`sub-lane ${isOver ? 'sub-lane-over' : ''} ${highlight ? 'sub-lane-highlight' : ''}`}
      data-parent={parentId}
      data-target={subLaneId}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: isOver ? '#90caf9' : highlight ? '#a5d6a7' : '#dcdfe4',
        borderRadius: '6px',
        border: '2px dashed #5e6c84',
        padding: '8px',
        minHeight: '50px',
        transition: 'all 0.2s ease'
      }}>
      <span className="sub-lane-title">{displayTitle}</span>
    </div>
  );
}

function MainLaneContent({ id, title, subLanes, showSubLanes, overId, activeId, availableTargets }) {
  const showThisLane = showSubLanes && activeId && availableTargets && availableTargets.length > 0;
  const allItems = subLanes.flatMap(s => s.items);

  const visibleSubLanes = showThisLane
    ? subLanes.filter(subLane =>
        availableTargets.some(t => t.subLaneId === subLane.id && t.laneId === id)
      )
    : subLanes;

  return (
    <div className="main-lane">
      <h3 className="main-lane-title">{title}</h3>
      <div className="main-lane-content">
        <div className="main-lane-items">
          {allItems.map((item) => (
            <SortableItem key={item.id} id={item.id} content={item.content} />
          ))}
        </div>
        {showThisLane && visibleSubLanes.length > 0 && (
          <div className={`sub-lanes-overlay active`}>
            {visibleSubLanes.map((subLane) => {
              const targetInfo = availableTargets.find(t => t.subLaneId === subLane.id && t.laneId === id);
              const isOver = overId && overId.target === subLane.id;
              const highlight = !!targetInfo;
              return (
                <SubLane
                  key={`${id}-${subLane.id}`}
                  subLaneId={subLane.id}
                  parentId={id}
                  displayTitle={subLane.title}
                  isOver={isOver}
                  highlight={highlight}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

async function fetchNextStates(currentLaneId, currentSubLaneId, taskType, allData) {
  const allSubLanes = [];

  const configByType = (type) => {
    if (type === 'affair') {
      return { dev: ['dev-cl'], test: ['test-sm', 'test-uat'], done: ['done-wc'] };
    }
    return { dev: ['dev-kf'], test: ['test-sm', 'test-uat'], done: ['done-wc'] };
  };

  const config = configByType(taskType);

  for (const laneId in allData) {
    const allowedSubLanes = config[laneId];
    if (!allowedSubLanes) continue;

    for (const subLane of allData[laneId].subLanes) {
      if (allowedSubLanes.includes(subLane.id)) {
        allSubLanes.push({
          laneId,
          laneTitle: allData[laneId].title,
          subLaneId: subLane.id,
          subLaneTitle: subLane.title,
        });
      }
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const availableTargets = allSubLanes.filter(
        s => s.subLaneId !== currentSubLaneId
      );
      resolve(availableTargets);
    }, 50);
  });
}

function KanbanBoard({ initialData = {}, onBack }) {
  const [data, setData] = useState(initialData);
  const [activeId, setActiveId] = useState(null);
  const [showSubLanes, setShowSubLanes] = useState(false);
  const [overId, setOverId] = useState(null);
  const [availableTargets, setAvailableTargets] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = async (event) => {
    const itemId = event.active.id;
    setActiveId(itemId);
    setShowSubLanes(true);

    let currentLaneId = null;
    let currentSubLaneId = null;
    let taskType = 'dev';

    for (const laneId in data) {
      for (const subLane of data[laneId].subLanes) {
        const item = subLane.items.find(i => i.id === itemId);
        if (item) {
          currentLaneId = laneId;
          currentSubLaneId = subLane.id;
          taskType = item.type || 'dev';
          break;
        }
      }
      if (currentLaneId) break;
    }

    const targets = await fetchNextStates(currentLaneId, currentSubLaneId, taskType, data);
    setAvailableTargets(targets);
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (over && over.id && over.id.startsWith('sublane_')) {
      const parts = over.id.split('_');
      if (parts.length >= 3) {
        const targetLaneId = parts[1];
        const targetSubLaneId = parts[2];
        setOverId({ parent: targetLaneId, target: targetSubLaneId });
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active } = event;
    const currentOverId = overId;
    const movedId = active.id;
    
    setShowSubLanes(false);
    setOverId(null);
    setActiveId(null);
    setAvailableTargets([]);

    if (movedId && currentOverId && currentOverId.target) {
      setData(prevData => {
        let sourceSubLaneId = null;
        
        for (const laneId in prevData) {
          for (const subLane of prevData[laneId].subLanes) {
            if (subLane.items.some(i => i.id === movedId)) {
              sourceSubLaneId = subLane.id;
              break;
            }
          }
          if (sourceSubLaneId) break;
        }
        
        if (!sourceSubLaneId || !currentOverId.target) {
          return prevData;
        }
        
        if (sourceSubLaneId === currentOverId.target) {
          return prevData;
        }
        
        const newData = { ...prevData };
        
        for (const laneId in newData) {
          newData[laneId] = {
            ...newData[laneId],
            subLanes: newData[laneId].subLanes.map(sl => ({ ...sl, items: [...sl.items] }))
          };
        }
        
        let movedItem = null;
        for (const laneId in newData) {
          for (const subLane of newData[laneId].subLanes) {
            if (subLane.id === sourceSubLaneId) {
              const itemIndex = subLane.items.findIndex(i => i.id === movedId);
              if (itemIndex !== -1) {
                [movedItem] = subLane.items.splice(itemIndex, 1);
                break;
              }
            }
          }
          if (movedItem) break;
        }
        
        for (const laneId in newData) {
          for (const subLane of newData[laneId].subLanes) {
            if (subLane.id === currentOverId.target && movedItem) {
              subLane.items.push(movedItem);
              break;
            }
          }
        }
        
        return newData;
      });
    }
  };

  const laneIds = Object.keys(data);
  
  return (
    <>
      <button className="back-button" onClick={onBack}>
        返回首页
      </button>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
        {laneIds.map((laneId) => {
          const lane = data[laneId];
          return (
            <MainLaneContent
              key={laneId}
              id={laneId}
              title={lane.title}
              subLanes={lane.subLanes}
              showSubLanes={showSubLanes}
              overId={overId}
              activeId={activeId}
              availableTargets={availableTargets}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="kanban-item kanban-item-overlay">
            Task
          </div>
        ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export default KanbanBoard;