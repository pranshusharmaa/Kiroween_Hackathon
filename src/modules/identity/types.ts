export type Role = 'ORG_ADMIN' | 'SRE_LEAD' | 'ONCALL_ENGINEER' | 'VIEWER';

export const ROLES: Record<Role, Role> = {
  ORG_ADMIN: 'ORG_ADMIN',
  SRE_LEAD: 'SRE_LEAD',
  ONCALL_ENGINEER: 'ONCALL_ENGINEER',
  VIEWER: 'VIEWER',
};

export interface UserWithMemberships {
  id: string;
  email: string;
  name: string;
  memberships: Array<{
    id: string;
    orgId: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}
