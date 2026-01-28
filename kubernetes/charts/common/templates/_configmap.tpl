{{/*
ConfigMap template
*/}}
{{- define "chefhub-common.configmap" -}}
{{- if .Values.configMap.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "chefhub-common.fullname" . }}
  labels:
    {{- include "chefhub-common.labels" . | nindent 4 }}
data:
  {{- toYaml .Values.configMap.data | nindent 2 }}
{{- end }}
{{- end }}
