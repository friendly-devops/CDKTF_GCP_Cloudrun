import { App } from 'cdktf';
import { BaseStackProps } from './lib/stacks/stackbase';
import { DbConfigs, DbStack } from './lib/stacks/cloudsql-stack';
import { CloudRunConfigs, CloudRunStack } from './lib/stacks/cloudrun-stack'
import { LbConfigs, LbStack } from './lib/stacks/loadbalancer-stack'
import { DnsRecordConfigs, DnsRecordStack } from './lib/stacks/dns-record-stack'
//import { RemoteBackend } from 'cdktf'; // uncomment this line to use Terraform Cloud

const StackProps: BaseStackProps = {
    name: "wordpress",
    project: "friendlydevops",
    region: "us-central1",
    gcpProject: `${process.env.GCP_PROJECT}`
}

const app = new App();

const DbProps: DbConfigs = {
    name: StackProps.name,
    project: StackProps.project,
    gcpProject: StackProps.gcpProject,
    region: StackProps.region,
    dbName: "wordpress",
}

const db = new DbStack(app, "db-stack", DbProps);

const CloudRunProps: CloudRunConfigs = {
    name: StackProps.name,
    project: StackProps.project,
    gcpProject: StackProps.gcpProject,
    region: StackProps.region,
    image: "wordpress:latest",
    dbAddress: db.dbInstance.firstIpAddress,
    dbName: DbProps.dbName,
}

const crService = new CloudRunStack(app, "crservice-stack", CloudRunProps)

const LbProps: LbConfigs = {
    name: StackProps.name,
    project: StackProps.project,
    gcpProject: StackProps.gcpProject,
    region: StackProps.region,
    neg: crService.neg.id,
    sslCert: "friendlydevops-cert-map",
}

const lb = new LbStack(app, "loadbalancer-stack", LbProps) 

const RecordProps: DnsRecordConfigs = {
    name: StackProps.name,
    project: StackProps.project,
    gcpProject: StackProps.gcpProject,
    region: StackProps.region,
    domain: "gcp.friendlydevops.com.",
    address: lb.address.address,
    zoneName:  "friendlydevops-auth",
}

new DnsRecordStack(app, "record-stack", RecordProps)

// To deploy using Terraform Cloud comment out the above line
// And uncomment the below block of lines

/*const stack = new DnsRecordStack(app, "record-stack", RecordProps);
new RemoteBackend(stack, {
  hostname: "app.terraform.io",
  organization: process.env.CDKTF_GCP_TFC_ORGANIZATION || "",
  workspaces: {
    name: "ecs-microservices-cdktf"
  }
}); */

app.synth();
