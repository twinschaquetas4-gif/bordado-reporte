'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Eye,
  UserCog,
  Check,
  X,
} from 'lucide-react'
import type { User, UserRole } from '@/lib/types'
import { ROLE_LABELS, ROLE_PERMISSIONS } from '@/lib/types'
import { loadUsers, saveUsers, generateId } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  admin: Shield,
  supervisor: UserCog,
  viewer: Eye,
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  supervisor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  viewer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

interface UserFormData {
  username: string
  password: string
  name: string
  role: UserRole
}

const emptyFormData: UserFormData = {
  username: '',
  password: '',
  name: '',
  role: 'viewer',
}

export function UserManager() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(emptyFormData)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setUsers(loadUsers())
  }, [])

  const handleSave = () => {
    setError('')
    
    if (!formData.username.trim() || !formData.name.trim()) {
      setError('El usuario y nombre son requeridos')
      return
    }

    if (!editingUser && !formData.password.trim()) {
      setError('La contraseña es requerida para nuevos usuarios')
      return
    }

    // Check for duplicate username
    const existingUser = users.find(
      u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== editingUser?.id
    )
    if (existingUser) {
      setError('Ya existe un usuario con ese nombre de usuario')
      return
    }

    let updatedUsers: User[]

    if (editingUser) {
      updatedUsers = users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              username: formData.username.trim(),
              password: formData.password.trim() || u.password,
              name: formData.name.trim(),
              role: formData.role,
            }
          : u
      )
    } else {
      const newUser: User = {
        id: generateId(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        role: formData.role,
        active: true,
        createdAt: new Date().toISOString(),
      }
      updatedUsers = [...users, newUser]
    }

    setUsers(updatedUsers)
    saveUsers(updatedUsers)
    setIsAddDialogOpen(false)
    setEditingUser(null)
    setFormData(emptyFormData)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
    })
    setError('')
  }

  const handleDelete = (user: User) => {
    const updatedUsers = users.filter(u => u.id !== user.id)
    setUsers(updatedUsers)
    saveUsers(updatedUsers)
    setDeleteConfirm(null)
  }

  const handleToggleActive = (user: User) => {
    const updatedUsers = users.map(u =>
      u.id === user.id ? { ...u, active: !u.active } : u
    )
    setUsers(updatedUsers)
    saveUsers(updatedUsers)
  }

  const openAddDialog = () => {
    setFormData(emptyFormData)
    setError('')
    setIsAddDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsAddDialogOpen(false)
    setEditingUser(null)
    setFormData(emptyFormData)
    setError('')
  }

  const renderUserForm = () => (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="nombre_usuario"
          className="bg-background border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña {editingUser && <span className="text-muted-foreground text-xs">(dejar vacío para mantener)</span>}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder={editingUser ? '••••••••' : 'Contraseña'}
          className="bg-background border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Juan Pérez"
          className="bg-background border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                Administrador
              </span>
            </SelectItem>
            <SelectItem value="supervisor">
              <span className="flex items-center gap-2">
                <UserCog className="h-4 w-4 text-yellow-400" />
                Supervisor
              </span>
            </SelectItem>
            <SelectItem value="viewer">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" />
                Visualizador
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Role permissions preview */}
      <div className="p-3 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm font-medium text-foreground mb-2">Permisos del rol:</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(ROLE_PERMISSIONS[formData.role]).map(([key, value]) => {
            const labels: Record<string, string> = {
              canManageUsers: 'Gestionar usuarios',
              canManageEmployees: 'Gestionar operarios',
              canCreateRecords: 'Crear registros',
              canEditRecords: 'Editar registros',
              canDeleteRecords: 'Eliminar registros',
              canViewAllRecords: 'Ver todos los registros',
              canViewReports: 'Ver reportes',
              canExportData: 'Exportar datos',
            }
            return (
              <span key={key} className="flex items-center gap-1">
                {value ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
                  {labels[key]}
                </span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
          <Users className="h-5 w-5 text-primary" />
          Gestión de Usuarios
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Crea un nuevo usuario para el sistema
              </DialogDescription>
            </DialogHeader>
            {renderUserForm()}
            <DialogFooter>
              <Button variant="outline" onClick={closeDialogs}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay usuarios registrados
            </p>
          ) : (
            users.map((user) => {
              const RoleIcon = ROLE_ICONS[user.role]
              const isCurrentUser = currentUser?.id === user.id
              const isDefaultAdmin = user.username === 'admin'
              
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    user.active
                      ? 'bg-background border-border'
                      : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${ROLE_COLORS[user.role]}`}>
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{user.name}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Tú
                          </Badge>
                        )}
                        {!user.active && (
                          <Badge variant="outline" className="text-xs border-muted-foreground text-muted-foreground">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>@{user.username}</span>
                        <span>•</span>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCurrentUser && !isDefaultAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(user)}
                        className={user.active ? 'text-yellow-500 hover:text-yellow-400' : 'text-green-500 hover:text-green-400'}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                    <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && closeDialogs()}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                          disabled={isDefaultAdmin && !isCurrentUser}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Editar Usuario</DialogTitle>
                          <DialogDescription>
                            Modifica los datos del usuario
                          </DialogDescription>
                        </DialogHeader>
                        {renderUserForm()}
                        <DialogFooter>
                          <Button variant="outline" onClick={closeDialogs}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                            Guardar Cambios
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {!isCurrentUser && !isDefaultAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(user)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteConfirm?.name}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
