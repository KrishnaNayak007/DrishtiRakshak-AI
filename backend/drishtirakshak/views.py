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
    org, _ = Organization.objects.get_or_create(
        name=org_name
    )
    
    membership, _ = OrganizationMembership.objects.get_or_create(
        user=user,
        organization=org,
        defaults={"role": "ADMIN" if role == 'POLICE' else "MEMBER"}
    )
    
    clean_plate = (vehicle_number or "MH-12-GQ-9831").strip().upper()
    vehicle, _ = Vehicle.objects.get_or_create(
        registration_number=clean_plate,
        defaults={"organization": org, "vehicle_type": Vehicle.VehicleType.OTHER}
    )
    return org, membership, vehicle


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email') or f"{username}@drishtirakshak.ai"
        password = request.data.get('password')
        full_name = request.data.get('full_name', '') or username
        vehicle_number = request.data.get('vehicleNumber') or request.data.get('vehicle_number', 'MH-12-GQ-9831')
        role = request.data.get('role', 'DRIVER')

        if not username or not password:
            return Response(
                {"error": "Username and password are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent duplicate email / username errors
        if email and User.objects.filter(email=email).exists():
            user = User.objects.filter(email=email).first()
        elif User.objects.filter(username=username).exists():
            user = User.objects.filter(username=username).first()
        else:
            first_name = full_name.split()[0] if full_name else username
            last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

        org, membership, vehicle = provision_user_tenant(user, vehicle_number, role)
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "has_registered_vehicle": True,
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "full_name": full_name or user.get_full_name() or user.username,
                    "role": role,
                    "vehicleNumber": vehicle.registration_number,
                }
            },
            status=status.HTTP_201_CREATED
        )


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token') or request.data.get('id_token') or request.data.get('access_token')
        role = request.data.get('role', 'DRIVER')
        vehicle_number = request.data.get('vehicleNumber') or request.data.get('vehicle_number')
        custom_username = request.data.get('username')
        custom_email = request.data.get('email')

        verified_email = custom_email
        verified_name = custom_username

        if token and isinstance(token, str):
            try:
                userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
                req = urllib.request.Request(userinfo_url, headers={"Authorization": f"Bearer {token}"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode())
                        verified_email = data.get('email') or verified_email
                        verified_name = data.get('name') or data.get('given_name') or verified_name
            except Exception:
                try:
                    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                    req = urllib.request.Request(tokeninfo_url)
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode())
                            verified_email = data.get('email') or verified_email
                            verified_name = data.get('name') or data.get('given_name') or verified_name
                except Exception:
                    pass

        if not verified_email:
            verified_email = custom_email or "og.krishnayak906561@gmail.com"
        if not verified_name:
            verified_name = custom_username or "Krishna"

        username = custom_username or verified_email.split('@')[0]
        
        user = None
        if verified_email and User.objects.filter(email=verified_email).exists():
            user = User.objects.filter(email=verified_email).first()
        else:
            # Enforce unique username by appending a counter if taken by another user account
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
                
            first_name = (verified_name or username).split()[0]
            last_name = " ".join((verified_name or "").split()[1:]) if len((verified_name or "").split()) > 1 else ""
            user = User.objects.create_user(
                username=username,
                email=verified_email,
                first_name=first_name,
                last_name=last_name,
                password=f"google_oauth_{username}_secure"
            )

        # Check existing vehicle for returning user
        existing_vehicle = Vehicle.objects.filter(organization__memberships__user=user).first()
        has_registered_vehicle = False
        active_vehicle_number = None

        if vehicle_number:
            # Prioritize explicitly provided vehicle number
            org, membership, vehicle = provision_user_tenant(user, vehicle_number, role)
            has_registered_vehicle = True
            active_vehicle_number = vehicle.registration_number
        elif existing_vehicle:
            has_registered_vehicle = True
            active_vehicle_number = existing_vehicle.registration_number
        else:
            # New user provisioning fallback
            if role == 'POLICE':
                # Police users do not require a physical vehicle node
                org, membership, vehicle = provision_user_tenant(user, "POLICE-HQ", role)
                has_registered_vehicle = True
                active_vehicle_number = vehicle.registration_number
            else:
                # Driver did not provide a vehicle number yet
                has_registered_vehicle = False

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "has_registered_vehicle": has_registered_vehicle,
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "full_name": verified_name or user.get_full_name() or user.username,
                    "role": role,
                    "vehicleNumber": active_vehicle_number,
                }
            },
            status=status.HTTP_200_OK
        )
