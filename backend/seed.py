import sys
import os
from datetime import datetime, timedelta

# Add backend directory to Python path to allow app imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models import db, User, Club, ClubMembership, Event, EventRSVP, Post, Comment, Announcement, Assignment, Attendance, TimetableSlot

app = create_app()

def seed_db():
    print("Connecting to the database...")
    with app.app_context():
        # Drop all tables first
        print("Dropping all tables to ensure clean slate...")
        db.drop_all()
        
        # Recreate tables
        print("Recreating database tables...")
        db.create_all()
        
        # 1. Create Users
        print("Seeding Users...")
        users_data = [
            {
                'username': 'rifathshifa',
                'email': 'rifathshifa.mr@gmail.com',
                'password': 'shifa@123!',
                'role': 'admin',
                'full_name': 'Administrator',
                'bio': 'System-wide campus administrator.',
                'major': 'Administration',
                'graduation_year': 2026
            },
            {
                'username': 'dev_society',
                'email': 'dev_society@campusconnect.edu',
                'password': 'password123',
                'role': 'club_leader',
                'full_name': 'Developer Society Leader',
                'bio': 'Official account for the Developer Society.',
                'major': 'Computer Science',
                'graduation_year': 2027
            },
            {
                'username': 'student_council',
                'email': 'council@campusconnect.edu',
                'password': 'password123',
                'role': 'club_leader',
                'full_name': 'Student Council President',
                'bio': 'Official account for the Campus Student Council.',
                'major': 'Political Science',
                'graduation_year': 2027
            },
            {
                'username': 'academic_advisor',
                'email': 'advisor@campusconnect.edu',
                'password': 'password123',
                'role': 'admin',
                'full_name': 'Academic Advisory Team',
                'bio': 'Advising students on their academic journey, workshops, and career opportunities.',
                'major': 'Education',
                'graduation_year': 2026
            },
            {
                'username': 'cs_club',
                'email': 'csclub@campusconnect.edu',
                'password': 'password123',
                'role': 'club_leader',
                'full_name': 'Computer Science Club Leader',
                'bio': 'Official representative of the CS Club.',
                'major': 'Computer Engineering',
                'graduation_year': 2028
            },
            {
                'username': 'alumni_assoc',
                'email': 'alumni@campusconnect.edu',
                'password': 'password123',
                'role': 'club_leader',
                'full_name': 'Alumni Association Representative',
                'bio': 'Connecting past graduates with current students.',
                'major': 'Business Administration',
                'graduation_year': 2026
            },
            {
                'username': 'sarah_j',
                'email': 'sarah.jenkins@campusconnect.edu',
                'password': 'password123',
                'role': 'student',
                'full_name': 'Sarah Jenkins',
                'bio': 'Sophomore loving software engineering, robotics, and hot cocoa.',
                'major': 'Computer Science',
                'graduation_year': 2028,
                'avatar_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
            },
            {
                'username': 'john_doe',
                'email': 'john.doe@campusconnect.edu',
                'password': 'password123',
                'role': 'student',
                'full_name': 'John Doe',
                'bio': 'Freshman trying to survive circuit theory and calculus.',
                'major': 'Electrical Engineering',
                'graduation_year': 2029,
                'avatar_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            },
            {
                'username': 'pending_staff',
                'email': 'pending_staff@campusconnect.edu',
                'password': 'password123',
                'role': 'staff',
                'verification_status': 'pending',
                'full_name': 'Jane Pending (Staff)',
                'bio': 'Staff member waiting for verification.',
                'major': 'Human Resources',
                'graduation_year': None
            },
            {
                'username': 'approved_staff',
                'email': 'approved_staff@campusconnect.edu',
                'password': 'password123',
                'role': 'staff',
                'verification_status': 'approved',
                'full_name': 'Bob Approved (Staff)',
                'bio': 'Approved staff member in Career Services.',
                'major': 'Career Services',
                'graduation_year': None
            }
        ]

        users = {}
        for ud in users_data:
            user = User(
                username=ud['username'],
                email=ud['email'],
                role=ud['role'],
                full_name=ud['full_name'],
                bio=ud['bio'],
                major=ud['major'],
                graduation_year=ud['graduation_year'],
                avatar_url=ud.get('avatar_url')
            )
            if 'verification_status' in ud:
                user.verification_status = ud['verification_status']
            user.set_password(ud['password'])
            db.session.add(user)
            users[ud['username']] = user
        
        # Commit users first to generate IDs
        db.session.commit()
        print(f"Successfully seeded {len(users)} users.")

        # 2. Seeding Clubs
        print("Seeding Clubs...")
        clubs_data = [
            {
                'key': 'dev_soc',
                'name': 'Developer Society',
                'description': 'Developing students into builders. We host weekly workshops, hackathons, and build cool things for the campus community.',
                'category': 'Technology',
                'creator': 'dev_society',
                'logo_url': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150'
            },
            {
                'key': 'std_council',
                'name': 'Student Council',
                'description': 'Representing the student voice on campus. We handle student concerns, campus events, and coffee shop discounts!',
                'category': 'Governance',
                'creator': 'student_council',
                'logo_url': 'https://images.unsplash.com/photo-1521791136368-1a9bde2974de?w=150'
            },
            {
                'key': 'cs_club',
                'name': 'Computer Science Club',
                'description': 'All things coding and computing. From algorithm practices to game development, we cater to tech enthusiasts of all majors.',
                'category': 'Technology',
                'creator': 'cs_club',
                'logo_url': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150'
            },
            {
                'key': 'alumni_assoc',
                'name': 'Alumni Association',
                'description': 'Connecting past and present students for mentoring, networking, and career growth opportunities.',
                'category': 'Professional',
                'creator': 'alumni_assoc',
                'logo_url': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150'
            }
        ]

        clubs = {}
        for cd in clubs_data:
            club = Club(
                name=cd['name'],
                description=cd['description'],
                category=cd['category'],
                creator_id=users[cd['creator']].id,
                logo_url=cd['logo_url']
            )
            db.session.add(club)
            clubs[cd['key']] = club

        db.session.commit()
        print(f"Successfully seeded {len(clubs)} clubs.")

        # 3. Seeding Club Memberships
        print("Seeding Club Memberships...")
        memberships_data = [
            {'user': 'sarah_j', 'club': 'dev_soc', 'role': 'officer'},
            {'user': 'sarah_j', 'club': 'cs_club', 'role': 'member'},
            {'user': 'john_doe', 'club': 'std_council', 'role': 'member'},
            {'user': 'john_doe', 'club': 'cs_club', 'role': 'member'},
            {'user': 'dev_society', 'club': 'dev_soc', 'role': 'leader'},
            {'user': 'student_council', 'club': 'std_council', 'role': 'leader'},
            {'user': 'cs_club', 'club': 'cs_club', 'role': 'leader'},
            {'user': 'alumni_assoc', 'club': 'alumni_assoc', 'role': 'leader'}
        ]

        for md in memberships_data:
            mem = ClubMembership(
                user_id=users[md['user']].id,
                club_id=clubs[md['club']].id,
                role=md['role']
            )
            db.session.add(mem)

        db.session.commit()
        print("Club memberships seeded.")

        # 4. Seeding Events
        print("Seeding Events...")
        events_data = [
            {
                'key': 'hackathon',
                'title': 'Hackathon 2026 Registrations Open',
                'description': 'Participate in the biggest campus hackathon of 2026! Bring your ideas, build prototypes, and pitch to leading industry experts. Catering and swag will be provided.',
                'location': 'Tech Hall Auditorium & Room 402',
                'event_date': datetime.utcnow() + timedelta(days=15),
                'organizer_club': 'dev_soc',
                'creator': 'dev_society',
                'volunteer_needed': True
            },
            {
                'key': 'orientation',
                'title': 'Orientation Week Meetup',
                'description': 'Meet your seniors, ask questions about courses, and learn about the best places to hang out or study on campus. Refreshments are on us.',
                'location': 'Campus Amphitheatre (Main Campus)',
                'event_date': datetime.utcnow() + timedelta(days=2),
                'organizer_club': 'alumni_assoc',
                'creator': 'alumni_assoc',
                'volunteer_needed': False
            },
            {
                'key': 'web_dev',
                'title': 'Introduction to Web Dev Workshop',
                'description': 'A hands-on coding workshop teaching HTML, CSS, and basic JavaScript. Perfect for absolute beginners who want to build their first web pages.',
                'location': 'Computer Science Lab 2 (Engineering Building)',
                'event_date': datetime.utcnow() + timedelta(days=5),
                'organizer_club': 'cs_club',
                'creator': 'cs_club',
                'volunteer_needed': True
            }
        ]

        events = {}
        for ed in events_data:
            event = Event(
                title=ed['title'],
                description=ed['description'],
                location=ed['location'],
                event_date=ed['event_date'],
                organizer_club_id=clubs[ed['organizer_club']].id if ed['organizer_club'] else None,
                creator_id=users[ed['creator']].id,
                volunteer_needed=ed['volunteer_needed']
            )
            db.session.add(event)
            events[ed['key']] = event

        db.session.commit()
        print(f"Successfully seeded {len(events)} events.")

        # 5. Seeding RSVPs
        print("Seeding RSVPs...")
        rsvps_data = [
            {'user': 'sarah_j', 'event': 'web_dev', 'status': 'going'},
            {'user': 'john_doe', 'event': 'web_dev', 'status': 'going'},
            {'user': 'sarah_j', 'event': 'orientation', 'status': 'interested'},
            {'user': 'john_doe', 'event': 'hackathon', 'status': 'going'}
        ]

        for rd in rsvps_data:
            rsvp = EventRSVP(
                user_id=users[rd['user']].id,
                event_id=events[rd['event']].id,
                status=rd['status']
            )
            db.session.add(rsvp)

        db.session.commit()
        print("Seeded event RSVPs.")

        # 6. Seeding Posts (Live Feed)
        print("Seeding Posts...")
        posts_data = [
            {
                'key': 'p1',
                'title': 'Hackathon 2026 Registrations Open',
                'content': 'We are super excited to announce that registration for Hackathon 2026 is officially open! Whether you are a coder, designer, or business strategist, come join us for 36 hours of creation. Make sure to RSVP to get our announcement updates.',
                'category': 'Events',
                'author': 'dev_society',
                'club': 'dev_soc',
                'days_ago': 1
            },
            {
                'key': 'p2',
                'title': 'New campus coffee shop discounts starting Monday',
                'content': 'Great news! The Student Council has successfully negotiated a 15% discount for all students at the Campus Coffee Hub. Simply flash your student portal ID at checkout starting next Monday!',
                'category': 'Clubs',
                'author': 'student_council',
                'club': 'std_council',
                'days_ago': 2
            },
            {
                'key': 'p3',
                'title': 'Volunteers needed for freshman mentoring programs',
                'content': 'The Academic Advisory is looking for junior/senior volunteers to mentor incoming freshmen. Help them transition smoothly into university life. Requirements: 2 hours per week for the first 6 weeks of the semester.',
                'category': 'Volunteer',
                'author': 'academic_advisor',
                'club': None,
                'days_ago': 3
            },
            {
                'key': 'p4',
                'title': 'Orientation Week Meetup',
                'content': 'Join the Alumni Association for a casual meet-and-greet this Wednesday. It is a great opportunity to ask alumni about career paths and get valuable campus survival tips.',
                'category': 'Events',
                'author': 'alumni_assoc',
                'club': 'alumni_assoc',
                'days_ago': 0
            },
            {
                'key': 'p5',
                'title': 'Introduction to Web Dev Workshop',
                'content': 'Ready to start your journey into software? The CS Club is hosting a hands-on React/CSS intro crash course. Bring your laptop, chargers, and plenty of questions!',
                'category': 'Clubs',
                'author': 'cs_club',
                'club': 'cs_club',
                'days_ago': 4
            },
            {
                'key': 'p6',
                'title': 'Textbook Exchange - CS101 & EE202',
                'content': 'Selling my CS101 (Intro to Programming) and EE202 (Linear Circuits) textbooks. No highlights, like-new condition. Meeting near the library.',
                'category': 'Marketplace',
                'price': 40.00,
                'author': 'sarah_j',
                'club': None,
                'days_ago': 1
            }
        ]

        posts = {}
        for pd in posts_data:
            post = Post(
                title=pd['title'],
                content=pd['content'],
                category=pd['category'],
                price=pd.get('price'),
                author_id=users[pd['author']].id,
                club_id=clubs[pd['club']].id if pd['club'] else None,
                created_at=datetime.utcnow() - timedelta(days=pd['days_ago'])
            )
            db.session.add(post)
            posts[pd['key']] = post

        db.session.commit()
        print(f"Successfully seeded {len(posts)} posts.")

        # 7. Seeding Comments
        print("Seeding Comments...")
        comments_data = [
            {
                'post': 'p6',
                'author': 'john_doe',
                'content': 'Hey Sarah, is the CS101 textbook still available? I can meet you tomorrow afternoon.'
            },
            {
                'post': 'p6',
                'author': 'sarah_j',
                'content': 'Yes, still available! Send me a DM and we can align on a time.'
            },
            {
                'post': 'p1',
                'author': 'sarah_j',
                'content': 'Looking forward to this hackathon! Already forming a team.'
            }
        ]

        for cd in comments_data:
            comm = Comment(
                post_id=posts[cd['post']].id,
                author_id=users[cd['author']].id,
                content=cd['content']
            )
            db.session.add(comm)

        db.session.commit()
        print("Comments seeded.")

        # 8. Seeding Announcements
        print("Seeding Announcements...")
        announcements_data = [
            {
                'title': 'Campus gym operations resume normal timings from tomorrow.',
                'content': 'The renovation works at the student gym are complete. Normal timings (6:00 AM - 10:00 PM) will resume starting tomorrow morning.',
                'author': 'rifathshifa',
                'days_ago': 0
            },
            {
                'title': 'Final examinations schedule has been uploaded to the university portal.',
                'content': 'Students can now check the detailed dates, times, and room allocations for all final exams on the student registry portal.',
                'author': 'rifathshifa',
                'days_ago': 1
            },
            {
                'title': 'Library group study rooms are now bookable through the app.',
                'content': 'To prevent queues and arguments, students can reserve study rooms on floors 2 to 4 in 2-hour blocks directly via this portal.',
                'author': 'rifathshifa',
                'days_ago': 2
            },
            {
                'title': 'Main Library will be closed on Sunday for maintenance.',
                'content': 'The Main Library building will be undergoing routine electrical maintenance and will remain closed all day Sunday.',
                'author': 'rifathshifa',
                'days_ago': 1
            },
            {
                'title': 'Enrollment for Fall Semester ends in 3 days.',
                'content': 'Friendly reminder that course registration changes and final enrollments close in 3 days. Late fees apply after the deadline.',
                'author': 'rifathshifa',
                'days_ago': 0
            }
        ]

        for ad in announcements_data:
            ann = Announcement(
                title=ad['title'],
                content=ad['content'],
                author_id=users[ad['author']].id,
                created_at=datetime.utcnow() - timedelta(days=ad['days_ago'])
            )
            db.session.add(ann)

        db.session.commit()
        print(f"Successfully seeded {len(announcements_data)} announcements.")

        # 9. Seeding Timetable Slots
        print("Seeding Timetable Slots...")
        timetable_data = [
            # Sarah Jenkins
            {
                'user': 'sarah_j',
                'course': 'CS301 - Web Development',
                'day_of_week': 'Monday',
                'start_time': '09:00',
                'end_time': '10:30',
                'room': 'Tech Hall Room 402',
                'instructor': 'Dr. Alice Smith'
            },
            {
                'user': 'sarah_j',
                'course': 'CS305 - Software Engineering',
                'day_of_week': 'Monday',
                'start_time': '11:00',
                'end_time': '12:30',
                'room': 'Engineering Bldg 101',
                'instructor': 'Prof. Alan Turing'
            },
            {
                'user': 'sarah_j',
                'course': 'CS301 - Web Development',
                'day_of_week': 'Wednesday',
                'start_time': '09:00',
                'end_time': '10:30',
                'room': 'Tech Hall Room 402',
                'instructor': 'Dr. Alice Smith'
            },
            {
                'user': 'sarah_j',
                'course': 'CS305 - Software Engineering',
                'day_of_week': 'Wednesday',
                'start_time': '11:00',
                'end_time': '12:30',
                'room': 'Engineering Bldg 101',
                'instructor': 'Prof. Alan Turing'
            },
            {
                'user': 'sarah_j',
                'course': 'CS320 - Artificial Intelligence',
                'day_of_week': 'Thursday',
                'start_time': '14:00',
                'end_time': '15:30',
                'room': 'Seminar Hall B',
                'instructor': 'Dr. Grace Hopper'
            },
            {
                'user': 'sarah_j',
                'course': 'CS310 - Database Systems',
                'day_of_week': 'Friday',
                'start_time': '10:00',
                'end_time': '12:00',
                'room': 'Lab 3 (Tech Hub)',
                'instructor': 'Dr. Edgar Codd'
            },
            # John Doe
            {
                'user': 'john_doe',
                'course': 'EE202 - Linear Circuits',
                'day_of_week': 'Monday',
                'start_time': '10:00',
                'end_time': '11:30',
                'room': 'Circuits Lab 1',
                'instructor': 'Dr. Nikola Tesla'
            },
            {
                'user': 'john_doe',
                'course': 'MA201 - Calculus III',
                'day_of_week': 'Tuesday',
                'start_time': '09:00',
                'end_time': '10:30',
                'room': 'Tech Hall Room 105',
                'instructor': 'Dr. Leonhard Euler'
            },
            {
                'user': 'john_doe',
                'course': 'EE202 - Linear Circuits',
                'day_of_week': 'Thursday',
                'start_time': '10:00',
                'end_time': '11:30',
                'room': 'Circuits Lab 1',
                'instructor': 'Dr. Nikola Tesla'
            },
            {
                'user': 'john_doe',
                'course': 'MA201 - Calculus III',
                'day_of_week': 'Thursday',
                'start_time': '13:00',
                'end_time': '14:30',
                'room': 'Tech Hall Room 105',
                'instructor': 'Dr. Leonhard Euler'
            }
        ]

        for slot_d in timetable_data:
            slot = TimetableSlot(
                course=slot_d['course'],
                day_of_week=slot_d['day_of_week'],
                start_time=slot_d['start_time'],
                end_time=slot_d['end_time'],
                room=slot_d['room'],
                instructor=slot_d['instructor'],
                user_id=users[slot_d['user']].id
            )
            db.session.add(slot)

        # 10. Seeding Attendance Records
        print("Seeding Attendance Records...")
        attendance_data = [
            # Sarah Jenkins
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 2},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 7},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 9},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Late', 'days_ago': 14},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 16},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 21},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 23},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 28},
            {'user': 'sarah_j', 'course': 'CS301 - Web Development', 'status': 'Present', 'days_ago': 30},

            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 2},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Absent', 'days_ago': 7},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 9},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 14},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 16},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 21},
            {'user': 'sarah_j', 'course': 'CS305 - Software Engineering', 'status': 'Present', 'days_ago': 23},

            {'user': 'sarah_j', 'course': 'CS320 - Artificial Intelligence', 'status': 'Present', 'days_ago': 5},
            {'user': 'sarah_j', 'course': 'CS320 - Artificial Intelligence', 'status': 'Present', 'days_ago': 12},
            {'user': 'sarah_j', 'course': 'CS320 - Artificial Intelligence', 'status': 'Present', 'days_ago': 19},
            {'user': 'sarah_j', 'course': 'CS320 - Artificial Intelligence', 'status': 'Present', 'days_ago': 26},

            {'user': 'sarah_j', 'course': 'CS310 - Database Systems', 'status': 'Present', 'days_ago': 4},
            {'user': 'sarah_j', 'course': 'CS310 - Database Systems', 'status': 'Present', 'days_ago': 11},
            {'user': 'sarah_j', 'course': 'CS310 - Database Systems', 'status': 'Late', 'days_ago': 18},
            {'user': 'sarah_j', 'course': 'CS310 - Database Systems', 'status': 'Present', 'days_ago': 25},

            # John Doe
            {'user': 'john_doe', 'course': 'EE202 - Linear Circuits', 'status': 'Present', 'days_ago': 2},
            {'user': 'john_doe', 'course': 'EE202 - Linear Circuits', 'status': 'Absent', 'days_ago': 9},
            {'user': 'john_doe', 'course': 'EE202 - Linear Circuits', 'status': 'Present', 'days_ago': 16},
            {'user': 'john_doe', 'course': 'EE202 - Linear Circuits', 'status': 'Present', 'days_ago': 23},
            {'user': 'john_doe', 'course': 'EE202 - Linear Circuits', 'status': 'Present', 'days_ago': 30},
            
            {'user': 'john_doe', 'course': 'MA201 - Calculus III', 'status': 'Present', 'days_ago': 3},
            {'user': 'john_doe', 'course': 'MA201 - Calculus III', 'status': 'Late', 'days_ago': 10},
            {'user': 'john_doe', 'course': 'MA201 - Calculus III', 'status': 'Present', 'days_ago': 17},
            {'user': 'john_doe', 'course': 'MA201 - Calculus III', 'status': 'Absent', 'days_ago': 24},
            {'user': 'john_doe', 'course': 'MA201 - Calculus III', 'status': 'Present', 'days_ago': 31}
        ]

        for att_d in attendance_data:
            att = Attendance(
                course=att_d['course'],
                status=att_d['status'],
                date=datetime.utcnow() - timedelta(days=att_d['days_ago']),
                user_id=users[att_d['user']].id
            )
            db.session.add(att)

        # 11. Seeding Assignments
        print("Seeding Assignments...")
        assignments_data = [
            # Sarah Jenkins
            {
                'user': 'sarah_j',
                'course': 'CS301 - Web Development',
                'title': 'Assignment 1: Responsive Layouts & CSS Grid',
                'description': 'Create a fully responsive webpage mockup using HTML and pure CSS Grid/Flexbox styling rules.',
                'due_date': datetime.utcnow() - timedelta(days=5),
                'status': 'Graded',
                'grade': 'A'
            },
            {
                'user': 'sarah_j',
                'course': 'CS301 - Web Development',
                'title': 'Assignment 2: React State & Global Context Providers',
                'description': 'Refactor the campus application to leverage centralized AuthContext state hook patterns.',
                'due_date': datetime.utcnow() + timedelta(days=2),
                'status': 'Pending',
                'grade': None
            },
            {
                'user': 'sarah_j',
                'course': 'CS305 - Software Engineering',
                'title': 'Project Milestone 1: Software Requirements Specification (SRS)',
                'description': 'Submit the comprehensive SRS document draft covering scope, use cases, and functional specs.',
                'due_date': datetime.utcnow() - timedelta(days=10),
                'status': 'Graded',
                'grade': 'A-'
            },
            {
                'user': 'sarah_j',
                'course': 'CS305 - Software Engineering',
                'title': 'Project Milestone 2: System Architecture Design',
                'description': 'Draw system database entity relationship models and component workflow blueprints.',
                'due_date': datetime.utcnow() + timedelta(days=5),
                'status': 'Submitted',
                'grade': None
            },
            {
                'user': 'sarah_j',
                'course': 'CS320 - Artificial Intelligence',
                'title': 'Lab 1: Search & Pathfinding Algorithms',
                'description': 'Implement A* search and BFS/DFS traversal schemas on coordinate maps.',
                'due_date': datetime.utcnow() - timedelta(days=3),
                'status': 'Submitted',
                'grade': None
            },
            {
                'user': 'sarah_j',
                'course': 'CS320 - Artificial Intelligence',
                'title': 'Lab 2: Neural Network Feedforward Models',
                'description': 'Code single-layer backpropagation algorithms using matrix operations in Python.',
                'due_date': datetime.utcnow() + timedelta(days=10),
                'status': 'Pending',
                'grade': None
            },
            
            # John Doe
            {
                'user': 'john_doe',
                'course': 'EE202 - Linear Circuits',
                'title': 'Lab Report: RLC Resonance Analysis',
                'description': 'Measure response peaks and compute impedance across varying frequencies in parallel circuits.',
                'due_date': datetime.utcnow() - timedelta(days=4),
                'status': 'Graded',
                'grade': 'B+'
            },
            {
                'user': 'john_doe',
                'course': 'EE202 - Linear Circuits',
                'title': 'Problem Set 4: Node Voltage Method equations',
                'description': 'Solve systems of mesh equations for circuit models involving dependent power sources.',
                'due_date': datetime.utcnow() + timedelta(days=1),
                'status': 'Pending',
                'grade': None
            },
            {
                'user': 'john_doe',
                'course': 'MA201 - Calculus III',
                'title': 'Homework 5: Double & Triple Integrals in Spherical Coordinates',
                'description': 'Compute volumes and centroids of complex geometric shapes.',
                'due_date': datetime.utcnow() - timedelta(days=2),
                'status': 'Submitted',
                'grade': None
            },
            {
                'user': 'john_doe',
                'course': 'MA201 - Calculus III',
                'title': 'Homework 6: Green\'s and Stokes\' Theorem equations',
                'description': 'Calculate circulation line integrals over boundary contours.',
                'due_date': datetime.utcnow() + timedelta(days=6),
                'status': 'Pending',
                'grade': None
            }
        ]

        for ass_d in assignments_data:
            ass = Assignment(
                course=ass_d['course'],
                title=ass_d['title'],
                description=ass_d['description'],
                due_date=ass_d['due_date'],
                status=ass_d['status'],
                grade=ass_d['grade'],
                user_id=users[ass_d['user']].id
            )
            db.session.add(ass)

        db.session.commit()
        print(f"Successfully seeded {len(assignments_data)} assignments.")
        print("Database seeding completed successfully!")


if __name__ == '__main__':
    seed_db()
