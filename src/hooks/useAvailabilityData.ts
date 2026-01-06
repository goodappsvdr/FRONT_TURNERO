import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { availabilityApi } from "@/services/availabilityApi";
import {
  mapApiResponseToConfig,
  mapOverridesToDateOverrides,
} from "@/utils/availabilityMapper";
import {
  createDefaultAvailabilityConfig,
  type AvailabilityConfig,
  type DateOverride,
} from "@/types/availability";
import { toast } from "sonner";

export function useAvailabilityData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const queryKey = ["availability", user?.IdEmpleado ?? null];

  const {
    data: availabilityConfig = createDefaultAvailabilityConfig(),
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async (): Promise<AvailabilityConfig> => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }

      const [availabilityResponse, overridesResponse] = await Promise.all([
        availabilityApi.getAvailability(user.IdEmpleado),
        availabilityApi.getOverrides(user.IdEmpleado),
      ]);

      const config = mapApiResponseToConfig(availabilityResponse);
      const overrides = mapOverridesToDateOverrides(overridesResponse.data);

      return {
        ...config,
        dateOverrides: overrides,
      };
    },
    enabled: !!user?.IdEmpleado,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (config: AvailabilityConfig) => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }
      await availabilityApi.saveAvailability(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Disponibilidad guardada exitosamente");
    },
    onError: (err) => {
      console.error("Error saving availability:", err);
      toast.error("Error al guardar la disponibilidad");
    },
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async (params: {
      days: number[];
      startTime: string;
      endTime: string;
    }) => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }
      await availabilityApi.createAvailability(
        user.IdEmpleado,
        params.days,
        params.startTime,
        params.endTime
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Disponibilidad creada exitosamente");
    },
    onError: (err) => {
      console.error("Error creating availability:", err);
      toast.error("Error al crear la disponibilidad");
    },
  });

  // const updateAvailabilityMutation = useMutation({
  //   mutationFn: async (params: {
  //     availabilityId: number;
  //     days: number[];
  //     startTime: string;
  //     endTime: string;
  //   }) => {
  //     if (!user?.IdEmpleado) {
  //       throw new Error("No employee ID available");
  //     }
  //     await availabilityApi.updateAvailability(
  //       params.availabilityId,
  //       user.IdEmpleado,
  //       params.days,
  //       params.startTime,
  //       params.endTime
  //     );
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey });
  //     toast.success("Disponibilidad actualizada exitosamente");
  //   },
  //   onError: (err) => {
  //     console.error("Error updating availability:", err);
  //     toast.error("Error al actualizar la disponibilidad");
  //   },
  // });

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (availabilityId: string) => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }
      await availabilityApi.deleteAvailability(
        Number(availabilityId),
        user.IdEmpleado
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousConfig =
        queryClient.getQueryData<AvailabilityConfig>(queryKey);

      if (previousConfig) {
        queryClient.setQueryData<AvailabilityConfig>(queryKey, {
          ...previousConfig,
          availabilityId: null,
        });
      }

      return { previousConfig };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Disponibilidad eliminada");
    },
    onError: (_err, _variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKey, context.previousConfig);
      }
      console.error("Error deleting availability:", _err);
      toast.error("No se pudo eliminar la disponibilidad");
    },
  });

  const createOverrideMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }
      await availabilityApi.createOverride(user.IdEmpleado, payload);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previousConfig =
        queryClient.getQueryData<AvailabilityConfig>(queryKey);
      const tempId = `temp-${Date.now()}`;

      if (previousConfig) {
        queryClient.setQueryData<AvailabilityConfig>(queryKey, {
          ...previousConfig,
          dateOverrides: [
            ...previousConfig.dateOverrides,
            {
              id: tempId,
              apiId: undefined,
              date: payload.date,
              timeRanges: [
                {
                  id: `temp-range-${Date.now()}`,
                  start: payload.startTime,
                  end: payload.endTime,
                },
              ],
            },
          ],
        });
      }

      return { previousConfig, tempId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Anulación guardada");
    },
    onError: (_err, _variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKey, context.previousConfig);
      }
      console.error("Error creating override:", _err);
      toast.error("No se pudo guardar la anulación");
    },
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: async (overrideApiId: string) => {
      if (!user?.IdEmpleado) {
        throw new Error("No employee ID available");
      }
      await availabilityApi.deleteOverride(
        Number(overrideApiId),
        user.IdEmpleado
      );
    },
    onMutate: async (overrideApiId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousConfig =
        queryClient.getQueryData<AvailabilityConfig>(queryKey);

      if (previousConfig) {
        queryClient.setQueryData<AvailabilityConfig>(queryKey, {
          ...previousConfig,
          dateOverrides: previousConfig.dateOverrides.filter(
            (o) => String(o.apiId) !== overrideApiId
          ),
        });
      }

      return { previousConfig };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Anulación eliminada");
    },
    onError: (_err, _variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(queryKey, context.previousConfig);
      }
      console.error("Error deleting override:", _err);
      toast.error("No se pudo eliminar la anulación");
    },
  });

  const overrideToPayload = (override: DateOverride) => {
    const range = override.timeRanges[0];
    if (!range) {
      throw new Error("Necesitas al menos un rango horario en la anulación.");
    }
    return {
      date: override.date,
      startTime: range.start,
      endTime: range.end,
    };
  };

  const handleSaveAvailability = async (config: AvailabilityConfig) => {
    await saveAvailabilityMutation.mutateAsync(config);
  };

  const handleCreateAvailability = async (
    days: number[],
    startTime: string,
    endTime: string
  ) => {
    createAvailabilityMutation.mutate({
      days,
      startTime,
      endTime,
    });
  };

  // const handleUpdateAvailability = async (
  //   availabilityId: number,
  //   days: number[],
  //   startTime: string,
  //   endTime: string
  // ) => {
  //   updateAvailabilityMutation.mutate({
  //     availabilityId,
  //     days,
  //     startTime,
  //     endTime,
  //   });
  // };

  const handleDeleteAvailability = async () => {
    if (!availabilityConfig.availabilityId) {
      toast.error("No hay disponibilidad cargada para eliminar.");
      return;
    }
    deleteAvailabilityMutation.mutate(
      String(availabilityConfig.availabilityId)
    );
  };

  const handleOverrideSave = async (
    override: DateOverride,
    originalOverride: DateOverride | null
  ) => {
    if (originalOverride?.apiId) {
      // Delete old override first, then create new one
      await deleteOverrideMutation.mutateAsync(String(originalOverride.apiId));
    }

    const payload = overrideToPayload(override);
    await createOverrideMutation.mutateAsync(payload);
  };

  const handleOverrideDelete = async (override: DateOverride) => {
    const overrideApiId =
      override.apiId ?? availabilityConfig.availabilityId ?? null;

    if (!overrideApiId) {
      // If no backend ID, just remove from local state by invalidating and letting query refetch
      queryClient.invalidateQueries({ queryKey });
      return;
    }

    await deleteOverrideMutation.mutateAsync(String(overrideApiId));
  };

  return {
    availabilityConfig,
    isLoading,
    isError,
    error,
    handleSaveAvailability,
    handleCreateAvailability,
    // handleUpdateAvailability,
    handleDeleteAvailability,
    handleOverrideSave,
    handleOverrideDelete,
    isSaving: saveAvailabilityMutation.isPending,
    isCreating: createAvailabilityMutation.isPending,
    // isUpdating: updateAvailabilityMutation.isPending,
    isDeleting: deleteAvailabilityMutation.isPending,
    isCreatingOverride: createOverrideMutation.isPending,
    isDeletingOverride: deleteOverrideMutation.isPending,
  };
}
