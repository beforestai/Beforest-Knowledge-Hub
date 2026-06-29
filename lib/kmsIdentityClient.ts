import type { CurrentUser, Team } from "@/types/kms";
import { teams as fallbackTeams } from "@/data/kmsData";

type TeamsResponse = {
  items: Team[];
};

async function parseApiError(response: Response) {
  try {
    const payload = await response.json();
    return payload.detail || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchTeams() {
  const response = await fetch("/api/teams", {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const payload = (await response.json()) as TeamsResponse;
  return payload.items.map((team) => ({
    ...team,
    description: fallbackTeams.find((fallbackTeam) => fallbackTeam.id === team.id)?.description || team.description || ""
  }));
}

export async function fetchCurrentUser() {
  const response = await fetch("/api/users/me", {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as CurrentUser;
}
