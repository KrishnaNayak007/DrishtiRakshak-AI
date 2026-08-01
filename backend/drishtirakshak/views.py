import json
import urllib.request
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from organizations.models import Organization, OrganizationMembership
from vehicles.models import Vehicle

User = get_user_model()

def provision_user_tenant(user, vehicle_number, role='DRIVER'):
    org_name = "Traffic Cyber Cell (PCR #04)" if role == 'POLICE' else "Drishti Rakshak Edge Fleet"
    slug = "traffic-cyber-cell" if role == 'POLICE' else "drishti-rakshak-edge-fleet"
    org, _ = Organization.objects.get_or_create(
        name=org_name,
        defaults={"slug": slug}
    )
    
    membership, _ = OrganizationMembership.objects.get_or_create(
        user=user,
        organization=org,
        defaults={"role": "ADMIN" if role == 'POLICE' else "MEMBER"}
    )
    
    clean_plate = (vehicle_number or "MH-12-GQ-9831").strip().upper()
    vehicle, _ = Vehicle.objects.get_or_create(
        organization=org,
        license_plate=clean_plate,
        defaults={"vehicle_type": "CAR"}
    )
    return org, membership, vehicle


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name', '')
        vehicle_number = request.data.get('vehicleNumber') or request.data.get('vehicle_number', 'MH-12-GQ-9831')
        role = request.data.get('role', 'DRIVER')

        if not username or not password:
            return Response(
                {"error": "Username and password are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
        else:
            first_name = full_name.split()[0] if full_name else username
            last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""
            user = User.objects.create_user(
                username=username,
                email=email or f"{username}@drishtirakshak.ai",
                password=password,
                first_name=first_name,
                last_name=last_name
            )

        # Provision Tenant, Membership, and Vehicle for active session
        provision_user_tenant(user, vehicle_number, role)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "full_name": full_name or user.get_full_name() or user.username,
                    "role": role,
                    "vehicleNumber": vehicle_number,
                }
            },
            status=status.HTTP_201_CREATED
        )


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token')
        role = request.data.get('role', 'DRIVER')
        vehicle_number = request.data.get('vehicleNumber') or request.data.get('vehicle_number', 'MH-12-GQ-9831')
        custom_username = request.data.get('username')

        verified_email = None
        verified_name = None

        if id_token and isinstance(id_token, str):
            try:
                # Verify Google ID token with Google's official API
                google_verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
                req = urllib.request.Request(google_verify_url)
                with urllib.request.urlopen(req, timeout=5) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode())
                        verified_email = data.get('email')
                        verified_name = data.get('name') or data.get('given_name')
            except Exception as e:
                print("Google token verification info:", e)

        if not verified_email:
            verified_email = request.data.get('email') or "google_user@drishtirakshak.ai"
            verified_name = request.data.get('name') or "Verified Google User"

        username = custom_username or verified_email.split('@')[0]
        
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
        elif User.objects.filter(email=verified_email).exists():
            user = User.objects.get(email=verified_email)
        else:
            first_name = (verified_name or username).split()[0]
            last_name = " ".join((verified_name or "").split()[1:]) if len((verified_name or "").split()) > 1 else ""
            user = User.objects.create_user(
                username=username,
                email=verified_email,
                first_name=first_name,
                last_name=last_name,
                password=f"google_oauth_{username}_secure"
            )

        # Provision Tenant, Membership, and Vehicle for active session
        provision_user_tenant(user, vehicle_number, role)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "full_name": verified_name or user.username,
                    "role": role,
                    "vehicleNumber": vehicle_number,
                }
            },
            status=status.HTTP_200_OK
        )
