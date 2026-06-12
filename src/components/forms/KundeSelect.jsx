import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
    queryFn: () =>
      supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
        .then(({ data }) => data ?? []),
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