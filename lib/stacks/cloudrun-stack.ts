import { Construct } from 'constructs';
import { GoogleStackBase, BaseStackProps } from './stackbase';
import { CloudRunV2Service } from '@cdktf/provider-google/lib/cloud-run-v2-service';
import { CloudRunV2ServiceIamBinding } from '@cdktf/provider-google/lib/cloud-run-v2-service-iam-binding';
import { ComputeRegionNetworkEndpointGroup } from '@cdktf/provider-google/lib/compute-region-network-endpoint-group'

export interface CloudRunConfigs extends BaseStackProps {
    name: string,
    project: string,
    gcpProject: string,
    region: string,
    image: string,
    dbAddress: string,
    dbName: string,
}

export class CloudRunStack extends GoogleStackBase {
    public neg: ComputeRegionNetworkEndpointGroup;
    constructor(scope: Construct, id: string, props: CloudRunConfigs) {
        super(scope, `${props.name}-${props.project}-${id}`, {
            name: props.name,
            project: props.project,
            region: props.region,
            gcpProject: props.gcpProject,
        })

        const instance = new CloudRunV2Service (this, `${props.name}-${id}`, {
            name: `${props.name}-service`,
            location: props.region,
            project: props.gcpProject,
            deletionProtection: false,
            template: {
                containers: [
                    {
                        image: props.image,
                        ports: {
                            containerPort: 80
                        },
                        env: [
                          {
                            name: "NAME",
                            value: `${props.name}-container`,
                          },
                          {
                            name: "WORDPRESS_DB_HOST",
                            value: props.dbAddress,
                          },
                          {
                            name: "WORDPRESS_DB_USER",
                            value: `${process.env.USER}`,
                          },
                          {
                            name: "WORDPRESS_DB_PASSWORD",
                            value: `${process.env.PASS}`,
                          },
                          {
                            name: "WORDPRESS_DB_NAME",
                            value: props.dbName,
                          }
                        ]
                    }
                ],
                vpcAccess: {
                    networkInterfaces: [
                        {
                            network: this.network.id,
                            subnetwork: this.subnetwork.id
                        }
                    ]
                }
            },
        });

        new CloudRunV2ServiceIamBinding (this, `${props.name}-iam-binding`, {
            location: props.region,
            name: instance.name,
            project: props.gcpProject,
            role: "roles/run.invoker",
            members: [ "allUsers" ]
        })

        this.neg = new ComputeRegionNetworkEndpointGroup(this, `${props.name}`, {
            name: `${props.name}-neg`,
            region: props.region,
            networkEndpointType: "SERVERLESS",
            //network: "default",
            cloudRun: {
                service: instance.name
            }
            
        });
    }
}
