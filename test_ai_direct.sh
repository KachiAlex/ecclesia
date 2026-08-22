#!/bin/bash
# Test AI Assistant service directly inside the Docker container
# This bypasses the auth layer and tests the core birthday/notification logic

echo "=========================================="
echo "  AI Assistant Direct Service Test"
echo "=========================================="

# Test 1: Query users with dateOfBirth via Prisma directly
echo ""
echo "[1/4] Testing Prisma query for users with dateOfBirth..."
docker exec pi-cms-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { dateOfBirth: { not: null } },
    select: { id: true, firstName: true, lastName: true, email: true, dateOfBirth: true, churchId: true }
  });
  console.log('Users with dateOfBirth:', JSON.stringify(users, null, 2));
  
  const totalUsers = await prisma.user.count();
  console.log('Total users:', totalUsers);
  
  const churches = await prisma.church.findMany({ select: { id: true, name: true } });
  console.log('Churches:', JSON.stringify(churches));
}
main().then(() => prisma.\$disconnect()).catch(e => { console.error(e); prisma.\$disconnect(); });
"

# Test 2: Test birthday calculation logic
echo ""
echo "[2/4] Testing birthday calculation logic..."
docker exec pi-cms-app node -e "
const today = new Date();
today.setHours(0, 0, 0, 0);
const daysAhead = 30;
const endDate = new Date(today);
endDate.setDate(endDate.getDate() + daysAhead);

// Simulate for user with DOB 1990-08-25
const dob = new Date('1990-08-25');
const upcomingBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
if (upcomingBirthday < today) {
  upcomingBirthday.setFullYear(today.getFullYear() + 1);
}
const diffMs = upcomingBirthday.getTime() - today.getTime();
const daysUntilBirthday = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
const ageTurning = upcomingBirthday.getFullYear() - dob.getFullYear();

console.log('Today:', today.toISOString().split('T')[0]);
console.log('DOB:', dob.toISOString().split('T')[0]);
console.log('Upcoming birthday:', upcomingBirthday.toISOString().split('T')[0]);
console.log('Days until birthday:', daysUntilBirthday);
console.log('Age turning:', ageTurning);
console.log('Within 30 days:', upcomingBirthday <= endDate ? 'YES' : 'NO');
"

# Test 3: Test Notification table operations
echo ""
echo "[3/4] Testing Notification table CRUD..."
docker exec pi-cms-app node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Create a test notification
  const church = await prisma.church.findFirst();
  if (!church) { console.log('No church found'); return; }
  
  const user = await prisma.user.findFirst({ where: { dateOfBirth: { not: null } } });
  if (!user) { console.log('No user with dateOfBirth found'); return; }
  
  const notif = await prisma.notification.create({
    data: {
      churchId: church.id,
      userId: user.id,
      type: 'BIRTHDAY',
      title: 'Test Birthday: ' + user.firstName + ' ' + user.lastName,
      message: user.firstName + ' has an upcoming birthday!',
      actionUrl: '/messages?to=' + user.id,
      actionLabel: 'Send Message',
      metadata: { test: true, ageTurning: 36 },
      scheduledFor: new Date(),
    }
  });
  console.log('Created notification:', notif.id);
  
  // Read it back
  const notifs = await prisma.notification.findMany({
    where: { churchId: church.id, status: 'PENDING' },
    orderBy: { scheduledFor: 'desc' },
    take: 5,
  });
  console.log('Pending notifications:', notifs.length);
  console.log('Notification details:', JSON.stringify(notifs[0], null, 2));
  
  // Update status
  await prisma.notification.update({
    where: { id: notif.id },
    data: { status: 'DISMISSED', dismissedAt: new Date() }
  });
  console.log('Notification dismissed');
  
  // Clean up - delete test notification
  await prisma.notification.delete({ where: { id: notif.id } });
  console.log('Test notification cleaned up');
  
  // Verify cleanup
  const remaining = await prisma.notification.count();
  console.log('Remaining notifications:', remaining);
}
main().then(() => prisma.\$disconnect()).catch(e => { console.error('ERROR:', e.message); prisma.\$disconnect(); });
"

# Test 4: Test AI message generation (fallback path - no API keys)
echo ""
echo "[4/4] Testing AI message generation (fallback)..."
docker exec pi-cms-app node -e "
// Simulate the generateBirthdayMessage function fallback
const firstName = 'Onyedikachi';
const lastName = 'Akoma';
const ageTurning = 36;
const churchName = 'Word & Miracle Embassy International';

// Without API keys, it should return the fallback message
const message = 'Happy Birthday, ' + firstName + '! May God bless you abundantly on this special day and throughout the year ahead. You are a cherished member of ' + churchName + ', and we celebrate the gift of you!';
console.log('Generated message:', message);
console.log('Message length:', message.length, 'chars');
"

echo ""
echo "=========================================="
echo "  Direct Service Test Complete"
echo "=========================================="
