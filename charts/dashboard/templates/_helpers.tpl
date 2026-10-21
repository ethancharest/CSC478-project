{{/*
Base name for chart resources: the release name.
Services are NOT named from this: the app code expects the fixed hostnames
"backend" (nginx.conf) and "db" (DB_HOST), so they keep those names.
That means one release of this chart per namespace.
*/}}
{{- define "dashboard.fullname" -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dashboard.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/* Name of the Secret holding the database credentials. */}}
{{- define "dashboard.dbSecretName" -}}
{{- if .Values.database.existingSecret -}}
{{- .Values.database.existingSecret -}}
{{- else -}}
{{- printf "%s-db-credentials" (include "dashboard.fullname" .) -}}
{{- end -}}
{{- end -}}

{{/* Cluster-scoped PV name, unique per release and namespace. */}}
{{- define "dashboard.pvName" -}}
{{- printf "%s-%s-pgdata" .Release.Namespace (include "dashboard.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "dashboard.image" -}}
{{- printf "%s/csc478-%s:%s" .root.Values.image.registry .component .root.Values.image.tag -}}
{{- end -}}
