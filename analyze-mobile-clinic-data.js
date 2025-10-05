const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function analyzeMobileClinicData() {
    try {
        console.log('🔍 تحليل بيانات العيادات المتنقلة...\n');

        // تسجيل الدخول
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@ahcp.com',
            password: 'admin123'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ تم تسجيل الدخول بنجاح');

        // جلب بيانات العيادات المتنقلة
        const mobileClinicsResponse = await axios.get(`${API_BASE_URL}/mobile-clinics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const records = mobileClinicsResponse.data.data;
        console.log(`\n📊 تم العثور على ${records.length} سجل\n`);

        if (records.length > 0) {
            console.log('🔍 تحليل أول سجل:');
            console.log('================');
            const firstRecord = records[0];
            
            console.log('📋 الهيكل الأساسي:');
            console.log('- serialNo:', firstRecord.serialNo);
            console.log('- date:', firstRecord.date);
            console.log('- _id:', firstRecord._id);
            
            console.log('\n👤 بيانات العميل (client):');
            if (firstRecord.client) {
                if (typeof firstRecord.client === 'object') {
                    console.log('- نوع البيانات: كائن مكتمل');
                    console.log('- الاسم:', firstRecord.client.name);
                    console.log('- رقم الهوية:', firstRecord.client.nationalId);
                    console.log('- الهاتف:', firstRecord.client.phone);
                    console.log('- القرية:', firstRecord.client.village);
                } else {
                    console.log('- نوع البيانات: مرجع ID فقط');
                    console.log('- ID:', firstRecord.client);
                }
            } else {
                console.log('- غير موجود');
            }
            
            console.log('\n🏥 بيانات الزيارة:');
            console.log('- المشرف:', firstRecord.supervisor);
            console.log('- رقم المركبة:', firstRecord.vehicleNo);
            console.log('- موقع المزرعة:', firstRecord.farmLocation);
            
            console.log('\n🐑 أعداد الحيوانات:');
            if (firstRecord.animalCounts) {
                console.log('- الأغنام:', firstRecord.animalCounts.sheep || 0);
                console.log('- الماعز:', firstRecord.animalCounts.goats || 0);
                console.log('- الإبل:', firstRecord.animalCounts.camel || 0);
                console.log('- الأبقار:', firstRecord.animalCounts.cattle || 0);
                console.log('- الخيول:', firstRecord.animalCounts.horse || 0);
            } else {
                // فحص إذا كانت البيانات في المستوى الأعلى
                console.log('- الأغنام:', firstRecord.sheep || 0);
                console.log('- الماعز:', firstRecord.goats || 0);
                console.log('- الإبل:', firstRecord.camel || 0);
                console.log('- الأبقار:', firstRecord.cattle || 0);
                console.log('- الخيول:', firstRecord.horse || 0);
            }
            
            console.log('\n🏥 التشخيص والعلاج:');
            console.log('- التشخيص:', firstRecord.diagnosis);
            console.log('- فئة التدخل:', firstRecord.interventionCategory);
            console.log('- العلاج:', firstRecord.treatment);
            
            console.log('\n📍 الموقع الجغرافي:');
            if (firstRecord.coordinates) {
                console.log('- خط العرض:', firstRecord.coordinates.latitude);
                console.log('- خط الطول:', firstRecord.coordinates.longitude);
            } else if (firstRecord.location) {
                console.log('- خط العرض (N):', firstRecord.location.n);
                console.log('- خط الطول (E):', firstRecord.location.e);
            } else {
                console.log('- غير محدد');
            }
            
            console.log('\n📝 معلومات الطلب:');
            if (firstRecord.request) {
                console.log('- تاريخ الطلب:', firstRecord.request.date);
                console.log('- حالة الطلب:', firstRecord.request.situation);
                console.log('- تاريخ التنفيذ:', firstRecord.request.fulfillingDate);
            } else {
                console.log('- غير موجود');
            }
            
            console.log('\n💊 الأدوية المستخدمة:');
            if (firstRecord.medicationsUsed && firstRecord.medicationsUsed.length > 0) {
                firstRecord.medicationsUsed.forEach((med, index) => {
                    console.log(`  ${index + 1}. ${med.name} - ${med.dosage} (${med.quantity})`);
                });
            } else {
                console.log('- لا توجد أدوية مسجلة');
            }
            
            console.log('\n📄 الهيكل الكامل للسجل:');
            console.log(JSON.stringify(firstRecord, null, 2));
        }

        // فحص العملاء
        console.log('\n\n👥 فحص بيانات العملاء...');
        try {
            const clientsResponse = await axios.get(`${API_BASE_URL}/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const clients = clientsResponse.data.data || clientsResponse.data;
            console.log(`📊 تم العثور على ${clients.length} عميل`);
            
            if (clients.length > 0) {
                console.log('\n🔍 تحليل أول عميل:');
                const firstClient = clients[0];
                console.log('- الاسم:', firstClient.name);
                console.log('- رقم الهوية:', firstClient.nationalId);
                console.log('- الهاتف:', firstClient.phone);
                console.log('- القرية:', firstClient.village);
                console.log('- العنوان التفصيلي:', firstClient.detailedAddress);
                
                if (firstClient.animals && firstClient.animals.length > 0) {
                    console.log('- الحيوانات:');
                    firstClient.animals.forEach((animal, index) => {
                        console.log(`  ${index + 1}. ${animal.animalType}: ${animal.animalCount} (${animal.breed})`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ خطأ في جلب بيانات العملاء:', error.message);
        }

    } catch (error) {
        console.error('❌ خطأ في التحليل:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

analyzeMobileClinicData();
