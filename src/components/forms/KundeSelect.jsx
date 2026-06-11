import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kundeName } from "@/lib/format";

export default function KundeSelect({ value, onChange }) {
  const { data: kunden = [] } = useQuery({
    queryKey: ["kunden"],
    queryFn: () => base44.entities.Kunde.list("-created_date", 200),
  });

  return (
    <Select
      value={value || ""}
      onValueChange={(id) => {
        const k = kunden.find((x) => x.id === id);
        onChange(id, kundeName(k));
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Kunde wählen" />
      </SelectTrigger>
      <SelectContent>
        {kunden.map((k) => (
          <SelectItem key={k.id} value={k.id}>
            {kundeName(k)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}