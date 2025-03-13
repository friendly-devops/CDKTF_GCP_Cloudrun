import { Construct } from 'constructs';
import * as cdktf from 'cdktf';
import { GoogleProvider } from '@cdktf/provider-google/lib/provider';
import { DataGoogleComputeNetwork } from '@cdktf/provider-google/lib/data-google-compute-network'
import { DataGoogleComputeSubnetwork } from '@cdktf/provider-google/lib/data-google-compute-subnetwork'
//import * fs from 'fs';


export interface BaseStackProps {
    name: string,
    project: string,
    region: string,
    gcpProject: string,
}

export class GoogleStackBase extends cdktf.TerraformStack {
    public _provider: cdktf.TerraformProvider;
    public network: DataGoogleComputeNetwork;
    public subnetwork: DataGoogleComputeSubnetwork;

    constructor(scope: Construct, id: string, baseProps: BaseStackProps) {
        super(scope, `${baseProps.project}-${id}`);
        this._provider = new GoogleProvider(this, 'google', {
            region: baseProps.region,
        })
        const bucketName =`${process.env.STATE_BUCKET}`

        new cdktf.GcsBackend(this, {
            bucket: bucketName,
            prefix: `${baseProps.project}/${id}`,
            //region: `${baseProps.region}`
        });

        this.network = new DataGoogleComputeNetwork(this, "network", {name: "default", project: baseProps.gcpProject});
        this.subnetwork = new DataGoogleComputeSubnetwork(this, "subnetwork", {name: "default", project: baseProps.gcpProject, region: baseProps.region});

/*        get provider(): cdktf.TerraformProvider {
            return this._provider;
        }*/
    }
}
