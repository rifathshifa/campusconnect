import io
import os
import unittest
from datetime import datetime
from app import create_app
from app.models import db, User, Department, Subject, StudyMaterial

class CampusConnectE2ETest(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_01_health_check(self):
        """Verify health check endpoint works."""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['database']['status'], 'ok')
        self.assertTrue(data['storage']['accessible'])

    def test_02_student_registration_and_login(self):
        """Verify student registration and login with essential fields."""
        unique_suffix = int(datetime.utcnow().timestamp())
        reg_payload = {
            'username': f'test_student_{unique_suffix}',
            'email': f'student_{unique_suffix}@campusconnect.edu',
            'password': 'password123',
            'role': 'student',
            'full_name': 'Test Student',
            'department': 'Computer Science & Engineering',
            'graduation_year': 2028
        }
        r_reg = self.client.post('/api/auth/register', json=reg_payload)
        self.assertEqual(r_reg.status_code, 201)
        self.assertIn('access_token', r_reg.get_json())

        # Test login
        r_login = self.client.post('/api/auth/login', json={
            'email': reg_payload['email'],
            'password': 'password123'
        })
        self.assertEqual(r_login.status_code, 200)
        token = r_login.get_json()['access_token']
        self.assertTrue(len(token) > 20)

    def test_03_student_browse_only_approved(self):
        """Verify non-staff students can ONLY see approved materials in Browse."""
        # Login as student (sarah_j)
        r_login = self.client.post('/api/auth/login', json={
            'email': 'sarah.jenkins@campusconnect.edu',
            'password': 'password123'
        })
        token = r_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        res = self.client.get('/api/study-materials?tab=browse', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(len(data['materials']) > 0)
        # Verify 100% of materials returned are approved
        for mat in data['materials']:
            self.assertEqual(mat['approval_status'], 'approved', f"Material {mat['id']} is not approved but visible to student!")

    def test_04_student_cannot_access_staff_pending(self):
        """Verify student is forbidden (403) from accessing pending approvals."""
        r_login = self.client.post('/api/auth/login', json={
            'email': 'sarah.jenkins@campusconnect.edu',
            'password': 'password123'
        })
        token = r_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Attempt GET /api/study-materials/pending
        r1 = self.client.get('/api/study-materials/pending', headers=headers)
        self.assertEqual(r1.status_code, 403)

        # Attempt GET /api/study-materials?tab=pending
        r2 = self.client.get('/api/study-materials?tab=pending', headers=headers)
        self.assertEqual(r2.status_code, 403)

    def test_05_student_upload_and_pending_status(self):
        """Verify student upload always starts as 'pending' and validates PDF."""
        r_login = self.client.post('/api/auth/login', json={
            'email': 'sarah.jenkins@campusconnect.edu',
            'password': 'password123'
        })
        token = r_login.get_json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # 1. Test non-PDF rejected
        dummy_txt = io.BytesIO(b'Some text content')
        r_txt = self.client.post('/api/study-materials/upload', headers=headers, data={
            'title': 'Test Non PDF',
            'subject': 'Data Structures',
            'department': 'Computer Science & Engineering',
            'year': '2nd Year',
            'semester': 'Semester 3',
            'material_type': 'Lecture Notes',
            'file': (dummy_txt, 'notes.txt')
        })
        self.assertEqual(r_txt.status_code, 400)
        self.assertIn('Invalid file format', r_txt.get_json()['message'])

        # 2. Test valid PDF upload
        dummy_pdf = io.BytesIO(b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
        r_up = self.client.post('/api/study-materials/upload', headers=headers, data={
            'title': 'Automata Theory Turing Machine Guide',
            'subject': 'Automata Theory & Computability',
            'department': 'Computer Science & Engineering',
            'year': '3rd Year',
            'semester': 'Semester 5',
            'material_type': 'Study Material',
            'description': 'Student notes on decidability and halting problem.',
            'file': (dummy_pdf, 'turing_machines.pdf')
        })
        self.assertEqual(r_up.status_code, 201)
        mat = r_up.get_json()['material']
        self.assertEqual(mat['approval_status'], 'pending')
        self.assertIsNone(mat['approved_by_id'])

        # 3. Student tries to approve their own upload -> MUST BE 403
        r_self_app = self.client.post(f"/api/study-materials/{mat['id']}/approve", headers=headers)
        self.assertEqual(r_self_app.status_code, 403)

    def test_06_staff_review_approve_and_reject_workflow(self):
        """Verify staff can view pending, approve, and reject with reason."""
        # Staff login
        r_staff = self.client.post('/api/auth/login', json={
            'email': 'approved_staff@campusconnect.edu',
            'password': 'password123'
        })
        staff_token = r_staff.get_json()['access_token']
        staff_headers = {'Authorization': f'Bearer {staff_token}'}

        # 1. Staff views pending list
        r_pending = self.client.get('/api/study-materials/pending', headers=staff_headers)
        self.assertEqual(r_pending.status_code, 200)
        pending_list = r_pending.get_json()['materials']
        self.assertTrue(len(pending_list) > 0)
        item_to_approve = pending_list[0]

        # 2. Staff previews PDF
        r_prev = self.client.get(f"/api/study-materials/{item_to_approve['id']}/preview", headers=staff_headers)
        self.assertEqual(r_prev.status_code, 200)
        self.assertEqual(r_prev.mimetype, 'application/pdf')

        # 3. Staff approves item
        r_app = self.client.post(f"/api/study-materials/{item_to_approve['id']}/approve", headers=staff_headers)
        self.assertEqual(r_app.status_code, 200)
        self.assertEqual(r_app.get_json()['material']['approval_status'], 'approved')

        # 4. Staff rejects an item with reason
        if len(pending_list) > 1:
            item_to_reject = pending_list[1]
            rejection_msg = "Please upload high-res scan with Unit 4 notes."
            r_rej = self.client.post(f"/api/study-materials/{item_to_reject['id']}/reject", headers=staff_headers, json={
                'reason': rejection_msg
            })
            self.assertEqual(r_rej.status_code, 200)
            self.assertEqual(r_rej.get_json()['material']['approval_status'], 'rejected')
            self.assertEqual(r_rej.get_json()['material']['rejection_reason'], rejection_msg)

    def test_07_unauthorized_download_protection(self):
        """Verify another student cannot download pending or rejected documents of other students."""
        # Create a fresh pending material
        dummy_pdf = io.BytesIO(b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
        # Login Sarah
        r_sarah = self.client.post('/api/auth/login', json={'email': 'sarah.jenkins@campusconnect.edu', 'password': 'password123'})
        token_sarah = r_sarah.get_json()['access_token']
        r_upload = self.client.post('/api/study-materials/upload', headers={'Authorization': f'Bearer {token_sarah}'}, data={
            'title': 'Sarah Private Draft Notes',
            'subject': 'Compiler Design',
            'department': 'Computer Science & Engineering',
            'year': '3rd Year',
            'semester': 'Semester 6',
            'material_type': 'Lecture Notes',
            'file': (dummy_pdf, 'compiler_notes.pdf')
        })
        sarah_mat_id = r_upload.get_json()['material']['id']

        # Login John Doe (different student)
        r_john = self.client.post('/api/auth/login', json={'email': 'john.doe@campusconnect.edu', 'password': 'password123'})
        token_john = r_john.get_json()['access_token']
        headers_john = {'Authorization': f'Bearer {token_john}'}

        # John tries to preview Sarah's pending material -> 403 Forbidden
        r_prev_john = self.client.get(f'/api/study-materials/{sarah_mat_id}/preview', headers=headers_john)
        self.assertEqual(r_prev_john.status_code, 403)

        # John tries to download Sarah's pending material -> 403 Forbidden
        r_dl_john = self.client.get(f'/api/study-materials/{sarah_mat_id}/download', headers=headers_john)
        self.assertEqual(r_dl_john.status_code, 403)


if __name__ == '__main__':
    unittest.main()
