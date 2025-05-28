import React, { useEffect, useState } from 'react';
import { View, Switch, StyleSheet, Text, Platform } from 'react-native';
import Dropdown from '../../../utils/dropdown';
import { changeEnabledPermission, getAllPermissions } from '../../../api/permisos';

const PermisosScreen: React.FC = () => {
  // Replace 'Role' with the actual type if it's imported or defined elsewhere
  const [toggles, setToggles] = useState<Record<string, boolean>>();
  const [permissions, setPermissions] = useState<any[]>([]); // Define a more specific type if available

  const fetchPermissions = async () => {
    const permissions = await getAllPermissions();
    const groupedPermissions = permissions.data.reduce((acc, perm: any) => {
      const roleId = perm.role_id;
      const roleName = perm.role?.name || `Role ${roleId}`;
      const moduleName = perm.module?.name || `Module ${perm.module_id}`;

      if (!acc[roleId]) {
        acc[roleId] = {
          id: roleId,
          name: roleName,
          modules: [],
        };
      }

      acc[roleId].modules.push({
        id: perm.module_id,
        name: moduleName,
        enabled: perm.enabled ?? false,
      });
      return acc;
    }, {} as Record<number, { id: number; name: string; modules: { id: number; name: string; enabled: boolean }[] }>);

    setPermissions(Object.values(groupedPermissions));
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const toggleSwitch = async (key: string, roleId: number, enabled: boolean) => {
    setToggles(prev => ({ ...prev, [key]: !(prev?.[key] ?? enabled) }));
    await changeEnabledPermission(roleId, parseInt(key, 10), !(toggles?.[key] ?? enabled));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gestion de roles y permisos</Text>
      <View>
        {
          permissions.map(permission => (
            <View key={permission.id} style={styles.card}>
              <Dropdown
                label={permission.name}
                options={permission.modules.map((item: any) => ({
                  key: `role-${permission.id}-mod-${item.id}`, 
                  label: item.name,
                  value: item.id.toString(),
                  component: (
                    <View style={styles.switchWrapper}>
                      <Switch
                        trackColor={{ false: '#ccc', true: '#5B78C7' }}
                        thumbColor={toggles?.[item.id] ? '#003EA8' : '#f4f3f4'}
                        ios_backgroundColor="#5B78C7"
                        onValueChange={() => toggleSwitch(item.id, permission.id, item.enabled)}
                        value={toggles?.[item.id] ?? item.enabled}
                      />
                    </View>
                  )
                }))}
                selectedValue={null}
              />
            
            </View>
          ))
        }
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#fdfaf6' },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
    padding: Platform.OS === 'ios' ? 14 : 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  switchWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default PermisosScreen;