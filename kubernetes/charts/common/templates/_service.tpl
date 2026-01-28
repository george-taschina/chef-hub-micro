{{/*
Service template
*/}}
{{- define "chefhub-common.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "chefhub-common.fullname" . }}
  labels:
    {{- include "chefhub-common.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
    {{- if .Values.service.grpcPort }}
    - port: {{ .Values.service.grpcPort }}
      targetPort: grpc
      protocol: TCP
      name: grpc
    {{- end }}
  selector:
    {{- include "chefhub-common.selectorLabels" . | nindent 4 }}
{{- end }}
