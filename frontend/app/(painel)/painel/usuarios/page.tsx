"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldUser, UserPlus, Users } from "lucide-react";

import { PainelPageHeader } from "@/components/painel/page-header";
import { PainelPageLoader } from "@/components/painel/page-loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { appToast } from "@/lib/toast";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  ROLE_ORDER,
} from "@/lib/user-roles";
import { createUser, listUsers, updateUser } from "@/services/api";
import { ApiError } from "@/services/apiError";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserRole,
} from "@/types/User";

const emptyCreateForm: CreateUserPayload = {
  name: "",
  email: "",
  role: "educador",
  password: "",
  password_confirmation: "",
};

const emptyEditForm: UpdateUserPayload = {
  name: "",
  email: "",
  role: "educador",
  is_active: true,
  password: "",
  password_confirmation: "",
};

function sortUsers(users: User[]) {
  return [...users].sort((left, right) => {
    const activeDiff = Number(right.is_active) - Number(left.is_active);

    if (activeDiff !== 0) {
      return activeDiff;
    }

    const roleDiff = ROLE_ORDER[left.role] - ROLE_ORDER[right.role];

    if (roleDiff !== 0) {
      return roleDiff;
    }

    return left.name.localeCompare(right.name, "pt-BR", {
      sensitivity: "base",
    });
  });
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRolePillClassName(role: UserRole) {
  if (role === "admin") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getStatusPillClassName(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-zinc-200 bg-zinc-100 text-zinc-700";
}

function mapUserToEditForm(user: User): UpdateUserPayload {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    password: "",
    password_confirmation: "",
  };
}

export default function UsuariosPage() {
  const { user: authenticatedUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>(emptyCreateForm);
  const [editForm, setEditForm] = useState<UpdateUserPayload>(emptyEditForm);
  const [createFormError, setCreateFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      try {
        const data = await listUsers();

        if (mounted) {
          setUsers(sortUsers(data));
        }
      } catch (error) {
        appToast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar os usuários.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  const activeAdminCount = useMemo(
    () =>
      users.filter(
        (currentUser) => currentUser.role === "admin" && currentUser.is_active,
      ).length,
    [users],
  );

  const userStats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((currentUser) => currentUser.role === "admin").length,
      educadores: users.filter((currentUser) => currentUser.role === "educador").length,
      inactive: users.filter((currentUser) => !currentUser.is_active).length,
    }),
    [users],
  );

  const selectedUserRules = useMemo(() => {
    if (!selectedUser) {
      return {
        isCurrentUser: false,
        isLastActiveAdmin: false,
      };
    }

    return {
      isCurrentUser: authenticatedUser?.id === selectedUser.id,
      isLastActiveAdmin:
        selectedUser.role === "admin" &&
        selectedUser.is_active &&
        activeAdminCount <= 1,
    };
  }, [activeAdminCount, authenticatedUser?.id, selectedUser]);

  function handleEditSheetChange(open: boolean) {
    setIsEditSheetOpen(open);

    if (!open) {
      setSelectedUser(null);
      setEditForm(emptyEditForm);
      setEditFormError(null);
    }
  }

  function openEditSheet(user: User) {
    setSelectedUser(user);
    setEditForm(mapUserToEditForm(user));
    setEditFormError(null);
    setIsEditSheetOpen(true);
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateFormError(null);

    try {
      const createdUser = await createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        role: createForm.role,
        password: createForm.password,
        password_confirmation: createForm.password_confirmation,
      });

      setUsers((currentUsers) => sortUsers([createdUser, ...currentUsers]));
      setCreateForm(emptyCreateForm);
      appToast.success("Usuário criado com sucesso.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível criar o usuário.";

      setCreateFormError(message);
      appToast.error(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleEditUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    setSavingEdit(true);
    setEditFormError(null);

    try {
      const payload: UpdateUserPayload = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        is_active: editForm.is_active,
      };

      if (editForm.password) {
        payload.password = editForm.password;
        payload.password_confirmation = editForm.password_confirmation;
      }

      const updatedUser = await updateUser(selectedUser.id, payload);

      setUsers((currentUsers) =>
        sortUsers(
          currentUsers.map((currentUser) =>
            currentUser.id === updatedUser.id ? updatedUser : currentUser,
          ),
        ),
      );

      handleEditSheetChange(false);
      appToast.success("Usuário atualizado com sucesso.");

      if (authenticatedUser?.id === updatedUser.id) {
        window.location.reload();
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível atualizar o usuário.";

      setEditFormError(message);
      appToast.error(message);
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return <PainelPageLoader label="Carregando usuários..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <PainelPageHeader
          title="Usuários"
          description="Crie contas de educadores e administradores, edite perfis, desative acessos e redefina senhas."
          actions={
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-700">
              <ShieldUser className="size-4" />
              Criação e edição restritas a administradores
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-violet-100 bg-violet-50/60">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total de contas</p>
                <p className="text-3xl font-extrabold">{userStats.total}</p>
              </div>
              <Users className="size-5 text-violet-700" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-3xl font-extrabold">{userStats.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Educadores</p>
              <p className="text-3xl font-extrabold">{userStats.educadores}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Desativados</p>
              <p className="text-3xl font-extrabold">{userStats.inactive}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Novo usuário</CardTitle>
              <CardDescription>
                Defina as credenciais de acesso ao painel. O e-mail será usado no
                login.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateUser}>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="name">Nome</FieldLabel>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Ex.: Maria da Silva"
                      disabled={creating}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="off"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      placeholder="educador@exemplo.com"
                      disabled={creating}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="role">Perfil</FieldLabel>
                    <Select
                      value={createForm.role}
                      onValueChange={(value) =>
                        setCreateForm((current) => ({
                          ...current,
                          role: value as UserRole,
                        }))
                      }
                      disabled={creating}
                    >
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {ROLE_DESCRIPTIONS[createForm.role]}
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      disabled={creating}
                      required
                    />
                    <FieldDescription>
                      Use pelo menos 8 caracteres com letras e números.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password_confirmation">
                      Confirmar senha
                    </FieldLabel>
                    <Input
                      id="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      value={createForm.password_confirmation}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          password_confirmation: event.target.value,
                        }))
                      }
                      disabled={creating}
                      required
                    />
                  </Field>

                  <FieldError>{createFormError}</FieldError>

                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? (
                      <>
                        <Spinner data-icon="inline-start" />
                        Criando usuário...
                      </>
                    ) : (
                      <>
                        <UserPlus className="size-4" />
                        Criar conta
                      </>
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários cadastrados</CardTitle>
              <CardDescription>
                O administrador pode editar nome, e-mail, perfil e status e
                definir uma nova senha. A própria conta logada e o último
                administrador ativo continuam protegidos.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[20rem]">Usuário</TableHead>
                      <TableHead className="min-w-[10rem]">Perfil</TableHead>
                      <TableHead className="min-w-[10rem]">Status</TableHead>
                      <TableHead className="min-w-[10rem]">Criado em</TableHead>
                      <TableHead className="min-w-[10rem] text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Nenhum usuário cadastrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => {
                        const isCurrentUser = authenticatedUser?.id === user.id;
                        const isLastActiveAdmin =
                          user.role === "admin" &&
                          user.is_active &&
                          activeAdminCount <= 1;

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <div className="font-semibold break-words">
                                  {user.name}
                                </div>
                                <div className="text-sm text-muted-foreground break-all">
                                  {user.email}
                                </div>
                                {isCurrentUser ? (
                                  <p className="text-xs text-muted-foreground">
                                    Você está usando esta conta agora.
                                  </p>
                                ) : null}
                                {!isCurrentUser && isLastActiveAdmin ? (
                                  <p className="text-xs text-muted-foreground">
                                    Último administrador ativo (protegido).
                                  </p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRolePillClassName(user.role)}`}
                              >
                                {ROLE_LABELS[user.role]}
                              </span>
                            </TableCell>
                            <TableCell className="align-top">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusPillClassName(user.is_active)}`}
                              >
                                {user.is_active ? "Ativo" : "Desativado"}
                              </span>
                            </TableCell>
                            <TableCell className="align-top">
                              {formatDateTime(user.created_at)}
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditSheet(user)}
                              >
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={isEditSheetOpen} onOpenChange={handleEditSheetChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <form onSubmit={handleEditUser} className="flex h-full flex-col">
            <SheetHeader className="border-b">
              <SheetTitle>Editar usuário</SheetTitle>
              <SheetDescription>
                Ajuste os dados da conta, desative o acesso quando necessário e
                preencha a senha abaixo apenas se quiser redefini-la.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-4 py-5">
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel htmlFor="edit-name">Nome</FieldLabel>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    disabled={savingEdit}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-email">E-mail</FieldLabel>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    disabled={savingEdit}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-role">Perfil</FieldLabel>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) =>
                      setEditForm((current) => ({
                        ...current,
                        role: value as UserRole,
                      }))
                    }
                    disabled={
                      savingEdit ||
                      selectedUserRules.isCurrentUser ||
                      selectedUserRules.isLastActiveAdmin
                    }
                  >
                    <SelectTrigger id="edit-role" className="w-full">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {selectedUserRules.isCurrentUser
                      ? "Seu próprio perfil não pode ser alterado por aqui."
                      : selectedUserRules.isLastActiveAdmin
                        ? "O último administrador ativo não pode perder o perfil de administrador."
                        : ROLE_DESCRIPTIONS[editForm.role]}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-status">Status do acesso</FieldLabel>
                  <label
                    htmlFor="edit-status"
                    className="flex items-center gap-3 rounded-md border px-3 py-3 text-sm"
                  >
                    <input
                      id="edit-status"
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      disabled={
                        savingEdit ||
                        selectedUserRules.isCurrentUser ||
                        selectedUserRules.isLastActiveAdmin
                      }
                      className="size-4 rounded border-input"
                    />
                    Usuário ativo e liberado para login
                  </label>
                  <FieldDescription>
                    {selectedUserRules.isCurrentUser
                      ? "Seu próprio acesso não pode ser desativado por esta tela."
                      : selectedUserRules.isLastActiveAdmin
                        ? "O último administrador ativo não pode ser desativado."
                        : "Ao desativar, o usuário perde o acesso ao painel no próximo login."}
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-password">Nova senha</FieldLabel>
                  <Input
                    id="edit-password"
                    type="password"
                    autoComplete="new-password"
                    value={editForm.password ?? ""}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    disabled={savingEdit}
                    placeholder="Preencha apenas para redefinir"
                  />
                  <FieldDescription>
                    Se deixar em branco, a senha atual será mantida.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-password-confirmation">
                    Confirmar nova senha
                  </FieldLabel>
                  <Input
                    id="edit-password-confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={editForm.password_confirmation ?? ""}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        password_confirmation: event.target.value,
                      }))
                    }
                    disabled={savingEdit}
                    placeholder="Repita a nova senha"
                  />
                </Field>

                <FieldError>{editFormError}</FieldError>
              </FieldGroup>
            </div>

            <SheetFooter className="border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditSheetChange(false)}
                disabled={savingEdit}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingEdit || !selectedUser}>
                {savingEdit ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
