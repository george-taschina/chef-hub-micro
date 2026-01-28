{{/*
Secret template
*/}}
{{- define "chefhub-common.secret" -}}
{{- if .Values.secret.enabled }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "chefhub-common.fullname" . }}
  labels:
    {{- include "chefhub-common.labels" . | nindent 4 }}
type: Opaque
data:
  {{- range $key, $value := .Values.secret.data }}
  {{ $key }}: {{ $value | b64enc | quote }}
  {{- end }}
{{- end }}
{{- end }}
