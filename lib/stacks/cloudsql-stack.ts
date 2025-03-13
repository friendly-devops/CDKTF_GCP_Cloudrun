import { Construct } from 'constructs';
import { GoogleStackBase, BaseStackProps } from './stackbase';
import { SqlDatabaseInstance } from '@cdktf/provider-google/lib/sql-database-instance'
import { SqlDatabase} from '@cdktf/provider-google/lib/sql-database'
import { SqlUser} from '@cdktf/provider-google/lib/sql-user'

export interface DbConfigs extends BaseStackProps {
    name: string,
    project: string,
    gcpProject: string,
    region: string,
    dbName: string,
}

export class DbStack extends GoogleStackBase {
    public dbInstance: SqlDatabaseInstance;
    constructor(scope: Construct, id: string, props: DbConfigs) {
        super(scope,  `${props.name}-${id}`, {
            name: `${props.name}`,
            project: `${props.project}`,
            region: `${props.region}`,
            gcpProject: props.gcpProject,
        })

        this.dbInstance = new SqlDatabaseInstance(this, `${props.name}-database-instance`, {
            name: props.name,
            region: props.region,
            project: props.gcpProject,
            deletionProtection: false,
            databaseVersion:"MYSQL_8_0",
            settings: {
                tier: "db-f1-micro",
                ipConfiguration: {
                    ipv4Enabled: false,
                    privateNetwork: this.network.selfLink,
                    enablePrivatePathForGoogleCloudServices: true
                }
            }
        });

        new SqlDatabase(this, `${props.name}-database`, {
            name: props.dbName,
            project: props.gcpProject,
            instance: this.dbInstance.name
        });

        new SqlUser(this, `${props.name}-user`, {
            name: `${process.env.USER}`,
            password: `${process.env.PASS}`,
            project: props.gcpProject,
            instance: this.dbInstance.name
        });
    }
}
