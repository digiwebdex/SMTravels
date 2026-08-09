import { OperationsTeamModule } from "./OperationsTeamModule";

/**
 * Hajj & Umrah → Muallim / Mutawwif. Reuses the Operations Team roster
 * (OperationsTeamMember) scoped to the MUALLIM role — full CRUD via the existing
 * ops API, no duplicate entity. Mutawwif members are managed here alongside Muallims.
 */
export function MuallimModule() {
  return <OperationsTeamModule defaultRole="MUALLIM" />;
}

export default MuallimModule;
