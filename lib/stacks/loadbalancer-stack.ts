import { Construct } from 'constructs';
import { GoogleStackBase, BaseStackProps } from './stackbase';
import { ComputeBackendService } from '@cdktf/provider-google/lib/compute-backend-service'
import { ComputeUrlMap } from '@cdktf/provider-google/lib/compute-url-map'
import { ComputeTargetHttpsProxy } from '@cdktf/provider-google/lib/compute-target-https-proxy'
import { ComputeGlobalAddress } from '@cdktf/provider-google/lib/compute-global-address'
import { ComputeGlobalForwardingRule } from '@cdktf/provider-google/lib/compute-global-forwarding-rule'

export interface LbConfigs extends BaseStackProps {
    name: string,
    project: string,
    gcpProject: string,
    region: string,
    neg: string,
    sslCert: string,
}

export class LbStack extends GoogleStackBase {
    public beService: ComputeBackendService;
    public address: ComputeGlobalAddress;
    constructor(scope: Construct, id: string, props: LbConfigs) {
        super(scope, `${props.name}-${props.project}-${id}`, {
            name: props.name,
            project: props.project,
            region: props.region,
            gcpProject: props.gcpProject,
        })

        this.beService = new ComputeBackendService (this, `${props.name}-${id}`, {
            name: props.name,
            project: props.gcpProject,
            loadBalancingScheme: "EXTERNAL_MANAGED",
            backend: [
                {
                    group: props.neg,
                }
            ]
        });

        const urlMap = new ComputeUrlMap(this, `${props.name}-url`, {
            defaultService: this.beService.id,
            name: `${props.name}-url-map`,
            project: props.gcpProject,
            pathMatcher: [
                {
                    name: "allpaths",
                    defaultService: this.beService.id,
                    routeRules: [
                        {
                            priority: 1,
                            urlRedirect: {
                                httpsRedirect: true,
                            }
                        }
                    ] 
                }
            ]

        });

        const proxy = new ComputeTargetHttpsProxy(this, `${props.name}-proxy`, {
            name: `${props.name}-proxy`,
            project: props.gcpProject,
            certificateMap: `//certificatemanager.googleapis.com/projects/${props.gcpProject}/locations/global/certificateMaps/${props.sslCert}`,
            urlMap: urlMap.id,
        });

        this.address = new ComputeGlobalAddress(this, `${props.name}-address`, {
            name: `${props.name}-address`,
            addressType: "EXTERNAL",
            project: props.gcpProject,
        })

        new ComputeGlobalForwardingRule(this, `${props.name}-forwarder`, {
            name: `${props.name}-forwarder`,
            ipAddress: this.address.id,
            loadBalancingScheme: "EXTERNAL_MANAGED",
            networkTier: "PREMIUM",
            portRange: "443",
            target: proxy.id,
        })
    }
}
