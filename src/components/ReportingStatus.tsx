import { useResource } from "../lib/resources";
import { signalPolicy } from "../lib/signals";
export function ReportingStatus({compact=false}:{compact?:boolean}) {
 const policy=useResource("reporting-policy-status",signalPolicy);
 if(compact)return <span role="status">Community reports: {policy.loading?"checking":policy.data?.enabled?"open":"closed"}</span>;
 return <span role="status">{policy.loading?"Checking reporting status…":policy.data?.enabled?"Community reporting is open for unverified awareness signals.":"Community reporting is closed."}</span>;
}
