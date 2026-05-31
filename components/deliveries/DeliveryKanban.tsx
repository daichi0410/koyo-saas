"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Driver, DeliveryWithDriver } from "@/lib/types";

interface DeliveryKanbanProps {
  deliveries: DeliveryWithDriver[];
  drivers: Driver[];
}

interface DeliveryCardProps {
  delivery: DeliveryWithDriver;
  isDragging?: boolean;
}

function DeliveryCard({ delivery, isDragging }: DeliveryCardProps) {
  const router = useRouter();

  const oilColorClass = {
    軽油: "bg-green-500/20 text-green-400 border-green-500/30",
    重油: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    灯油: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  }[delivery.oil_type];

  const statusLabel = {
    scheduled: "予定",
    in_progress: "進行中",
    completed: "完了",
    cancelled: "キャンセル",
  }[delivery.status];

  const statusClass = {
    scheduled: "bg-gray-500/20 text-gray-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  }[delivery.status];

  return (
    <div
      className={`p-3 bg-dark-panel2 border border-dark-border rounded-lg cursor-pointer hover:border-cyan/50 transition-colors ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/deliveries/${delivery.id}`);
      }}
    >
      {/* 会社名 */}
      <div className="font-bold text-white text-sm truncate">
        {delivery.company_name}
      </div>

      {/* 現場名 */}
      {delivery.site_name && (
        <div className="text-xs text-dark-muted mt-0.5 truncate">
          {delivery.site_name}
        </div>
      )}

      {/* 油種・ステータス */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${oilColorClass}`}
        >
          {delivery.oil_type}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* 時間指定 */}
      {delivery.time_spec && delivery.time_spec !== "-" && (
        <div className="mt-2 text-[10px] text-cyan bg-cyan/10 px-1.5 py-0.5 rounded inline-block">
          {delivery.time_spec}
        </div>
      )}
    </div>
  );
}

function SortableDeliveryCard({ delivery }: { delivery: DeliveryWithDriver }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: delivery.id,
    data: {
      type: "delivery",
      delivery,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DeliveryCard delivery={delivery} isDragging={isDragging} />
    </div>
  );
}

interface DriverColumnProps {
  driver: Driver | null;
  deliveries: DeliveryWithDriver[];
}

function DriverColumn({ driver, deliveries }: DriverColumnProps) {
  const columnId = driver?.id || "unassigned";

  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: {
      type: "column",
      driverId: driver?.id || null,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-64 bg-dark-panel border border-dark-border rounded-lg flex flex-col h-full ${
        isOver ? "ring-2 ring-cyan" : ""
      }`}
    >
      {/* カラムヘッダー */}
      <div className="p-3 border-b border-dark-border flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: driver?.color || "#666" }}
        />
        <span className="font-bold text-white text-sm truncate">
          {driver?.name || "未割当"}
        </span>
        <span className="text-dark-muted text-xs ml-auto">
          {deliveries.length}
        </span>
      </div>

      {/* カード一覧 */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext
          items={deliveries.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deliveries.map((delivery) => (
            <SortableDeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </SortableContext>
        {deliveries.length === 0 && (
          <div className="text-center text-dark-muted text-xs py-8">
            配車なし
          </div>
        )}
      </div>
    </div>
  );
}

export function DeliveryKanban({ deliveries, drivers }: DeliveryKanbanProps) {
  const [activeDelivery, setActiveDelivery] =
    useState<DeliveryWithDriver | null>(null);
  const [localDeliveries, setLocalDeliveries] =
    useState<DeliveryWithDriver[]>(deliveries);

  // propsが変更されたらローカル状態を更新
  useEffect(() => {
    setLocalDeliveries(deliveries);
  }, [deliveries]);

  // DeliveriesをドライバーIDでグループ化
  const getDeliveriesByDriver = (driverId: string | null) => {
    return localDeliveries.filter((d) =>
      driverId === null ? d.driver_id === null : d.driver_id === driverId
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const delivery = localDeliveries.find((d) => d.id === active.id);
    if (delivery) {
      setActiveDelivery(delivery);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDelivery(null);

    if (!over) return;

    const activeDeliveryId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current;

    // ドロップ先のドライバーIDを特定
    let targetDriverId: string | null = null;

    // over.dataからタイプを判断
    if (overData?.type === "column") {
      // カラムへのドロップ
      targetDriverId = overData.driverId;
    } else if (overData?.type === "delivery") {
      // 配車カードへのドロップ（その配車のドライバーIDを取得）
      targetDriverId = overData.delivery?.driver_id;
    } else {
      // フォールバック: over.idがドライバーIDか配車IDかを判断
      if (overId === "unassigned") {
        targetDriverId = null;
      } else if (drivers.some((d) => d.id === overId)) {
        targetDriverId = overId;
      } else {
        const overDelivery = localDeliveries.find((d) => d.id === overId);
        if (overDelivery) {
          targetDriverId = overDelivery.driver_id;
        }
      }
    }

    // 現在の配車を取得
    const delivery = localDeliveries.find((d) => d.id === activeDeliveryId);
    if (!delivery) return;

    // 同じドライバーへのドロップは無視
    if (delivery.driver_id === targetDriverId) return;

    // ローカル状態を先に更新（楽観的更新）
    const targetDriver = drivers.find((d) => d.id === targetDriverId) || null;
    setLocalDeliveries((prev) =>
      prev.map((d) =>
        d.id === activeDeliveryId
          ? { ...d, driver_id: targetDriverId, driver: targetDriver }
          : d
      )
    );

    // APIでドライバーを更新
    try {
      const response = await fetch(`/api/deliveries/${activeDeliveryId}/driver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver_id: targetDriverId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update driver");
      }
    } catch (error) {
      console.error("Error updating driver:", error);
      // エラー時はローカル状態を元に戻す
      setLocalDeliveries(deliveries);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 h-full overflow-x-auto">
        {/* 未割当カラム */}
        <DriverColumn driver={null} deliveries={getDeliveriesByDriver(null)} />

        {/* ドライバー別カラム */}
        {drivers
          .filter((d) => d.is_active)
          .map((driver) => (
            <DriverColumn
              key={driver.id}
              driver={driver}
              deliveries={getDeliveriesByDriver(driver.id)}
            />
          ))}
      </div>

      {/* ドラッグ中のオーバーレイ */}
      <DragOverlay>
        {activeDelivery ? (
          <DeliveryCard delivery={activeDelivery} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
