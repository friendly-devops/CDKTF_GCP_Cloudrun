import { Construct } from 'constructs';
import { GoogleStackBase, BaseStackProps } from './stackbase';
import { DnsRecordSet } from '@cdktf/provider-google/lib/dns-record-set'

export interface DnsRecordConfigs extends BaseStackProps {
    name: string,
    domain: string,
    project: string,
    gcpProject: string,
    region: string,
    address: string,
    zoneName: string,
}

export class DnsRecordStack extends GoogleStackBase {
    constructor(scope: Construct, id: string, props: DnsRecordConfigs) {
        super(scope, `${props.name}-${props.project}-${id}`, {
            name: props.name,
            project: props.project,
            region: props.region,
            gcpProject: props.gcpProject,
        })

        new DnsRecordSet (this, `${props.name}-${id}`, {
            name: `${props.name}.${props.domain}`,
            type: "A",
            rrdatas: [
                props.address
            ],
            ttl: 60,
            managedZone: props.zoneName,
            project: props.gcpProject
        });
    }
}

