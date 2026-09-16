import { del, get, keys, set } from "idb-keyval";

import type { Field } from "./certificate";

const PREFIX = "project:";

export type SavedProject = {
  id: string;
  name: string;
  createdAt: number;
  fields: Field[];
  template: Blob;
};

export async function listProjects(): Promise<SavedProject[]> {
  const all = await keys();
  const projectKeys = all.filter((k) => typeof k === "string" && k.startsWith(PREFIX)) as string[];
  const items = await Promise.all(projectKeys.map((k) => get<SavedProject>(k)));
  return (items.filter(Boolean) as SavedProject[]).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveProject(name: string, fields: Field[], template: Blob) {
  const project: SavedProject = {
    id: `${Date.now()}`,
    name,
    createdAt: Date.now(),
    fields,
    template,
  };
  await set(PREFIX + project.id, project);
  return project;
}

export async function removeProject(id: string) {
  await del(PREFIX + id);
}

export async function clearProjects() {
  const all = await keys();
  await Promise.all(
    (all.filter((k) => typeof k === "string" && k.startsWith(PREFIX)) as string[]).map((k) =>
      del(k),
    ),
  );
}
