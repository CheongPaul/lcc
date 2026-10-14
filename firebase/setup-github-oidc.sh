#!/usr/bin/env bash
# Run manually in YOUR Google Cloud Shell after reviewing this file.
# No billing changes, service-account keys, Cloud Functions, or paid schedulers.
set -euo pipefail
LCC_PROJECT=lccstats
LCC_NUMBER=76567286678
LCC_ACCOUNT=lcc-pom-sender@lccstats.iam.gserviceaccount.com
LCC_CONDITION="assertion.repository_id == '1416260122' && assertion.repository_owner_id == '82016463' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == 'CheongPaul/lcc/.github/workflows/pom-notifications.yml@refs/heads/main'"
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com firestore.googleapis.com fcm.googleapis.com fcmregistrations.googleapis.com --project="$LCC_PROJECT"
if ! gcloud iam service-accounts describe "$LCC_ACCOUNT" --project="$LCC_PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create lcc-pom-sender --display-name='LCC POM sender' --project="$LCC_PROJECT"
fi
# Minimum document operations plus FCM sending, without project administration.
LCC_PERMISSIONS='cloudmessaging.messages.create,datastore.entities.get,datastore.entities.list,datastore.entities.create,datastore.entities.update,datastore.entities.delete'
if gcloud iam roles describe lccPomSender --project="$LCC_PROJECT" >/dev/null 2>&1; then
  gcloud iam roles update lccPomSender --permissions="$LCC_PERMISSIONS" --project="$LCC_PROJECT"
else
  gcloud iam roles create lccPomSender --title='LCC POM sender' --permissions="$LCC_PERMISSIONS" --stage=GA --project="$LCC_PROJECT"
fi
gcloud projects add-iam-policy-binding "$LCC_PROJECT" --member="serviceAccount:$LCC_ACCOUNT" --role="projects/$LCC_PROJECT/roles/lccPomSender" --condition=None
if ! gcloud iam workload-identity-pools describe lcc-github --location=global --project="$LCC_PROJECT" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create lcc-github --location=global --display-name='LCC GitHub' --project="$LCC_PROJECT"
fi
if gcloud iam workload-identity-pools providers describe github --workload-identity-pool=lcc-github --location=global --project="$LCC_PROJECT" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc github --workload-identity-pool=lcc-github --location=global --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' --attribute-condition="$LCC_CONDITION" --project="$LCC_PROJECT"
else
  gcloud iam workload-identity-pools providers create-oidc github --workload-identity-pool=lcc-github --location=global --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' --attribute-condition="$LCC_CONDITION" --project="$LCC_PROJECT"
fi
gcloud iam service-accounts add-iam-policy-binding "$LCC_ACCOUNT" --role=roles/iam.workloadIdentityUser --member="principalSet://iam.googleapis.com/projects/$LCC_NUMBER/locations/global/workloadIdentityPools/lcc-github/attribute.repository_id/1416260122" --project="$LCC_PROJECT"
printf '%s\n' 'OIDC configured. No private key created. Continue with firebase/README.md.'
