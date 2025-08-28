//src/pages/Dashboard/profile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../utils/api';

// List of countries from Signup.jsx for consistency
const countryCodes = [
  { code: '+355', name: 'Albania' },
  { code: '+213', name: 'Algeria' },
  { code: '+376', name: 'Andorra' },
  { code: '+244', name: 'Angola' },
  { code: '+1-268', name: 'Antigua and Barbuda' },
  { code: '+54', name: 'Argentina' },
  { code: '+374', name: 'Armenia' },
  { code: '+61', name: 'Australia' },
  { code: '+43', name: 'Austria' },
  { code: '+994', name: 'Azerbaijan' },
  { code: '+1-242', name: 'Bahamas' },
  { code: '+973', name: 'Bahrain' },
  { code: '+880', name: 'Bangladesh' },
  { code: '+1-246', name: 'Barbados' },
  { code: '+375', name: 'Belarus' },
  { code: '+32', name: 'Belgium' },
  { code: '+501', name: 'Belize' },
  { code: '+229', name: 'Benin' },
  { code: '+975', name: 'Bhutan' },
  { code: '+591', name: 'Bolivia' },
  { code: '+387', name: 'Bosnia and Herzegovina' },
  { code: '+267', name: 'Botswana' },
  { code: '+55', name: 'Brazil' },
  { code: '+673', name: 'Brunei' },
  { code: '+359', name: 'Bulgaria' },
  { code: '+226', name: 'Burkina Faso' },
  { code: '+257', name: 'Burundi' },
  { code: '+855', name: 'Cambodia' },
  { code: '+237', name: 'Cameroon' },
  { code: '+1', name: 'Canada' },
  { code: '+238', name: 'Cape Verde' },
  { code: '+56', name: 'Chile' },
  { code: '+57', name: 'Colombia' },
  { code: '+269', name: 'Comoros' },
  { code: '+506', name: 'Costa Rica' },
  { code: '+385', name: 'Croatia' },
  { code: '+357', name: 'Cyprus' },
  { code: '+420', name: 'Czech Republic' },
  { code: '+243', name: 'Democratic Republic of the Congo' },
  { code: '+45', name: 'Denmark' },
  { code: '+253', name: 'Djibouti' },
  { code: '+1-767', name: 'Dominica' },
  { code: '+1-809', name: 'Dominican Republic' },
  { code: '+593', name: 'Ecuador' },
  { code: '+20', name: 'Egypt' },
  { code: '+503', name: 'El Salvador' },
  { code: '+372', name: 'Estonia' },
  { code: '+268', name: 'Eswatini' },
  { code: '+251', name: 'Ethiopia' },
  { code: '+679', name: 'Fiji' },
  { code: '+358', name: 'Finland' },
  { code: '+33', name: 'France' },
  { code: '+241', name: 'Gabon' },
  { code: '+220', name: 'Gambia' },
  { code: '+995', name: 'Georgia' },
  { code: '+49', name: 'Germany' },
  { code: '+233', name: 'Ghana' },
  { code: '+30', name: 'Greece' },
  { code: '+1-473', name: 'Grenada' },
  { code: '+502', name: 'Guatemala' },
  { code: '+224', name: 'Guinea' },
  { code: '+245', name: 'Guinea-Bissau' },
  { code: '+592', name: 'Guyana' },
  { code: '+504', name: 'Honduras' },
  { code: '+852', name: 'Hong Kong' },
  { code: '+36', name: 'Hungary' },
  { code: '+354', name: 'Iceland' },
  { code: '+91', name: 'India' },
  { code: '+62', name: 'Indonesia' },
  { code: '+353', name: 'Ireland' },
  { code: '+972', name: 'Israel' },
  { code: '+39', name: 'Italy' },
  { code: '+1-876', name: 'Jamaica' },
  { code: '+81', name: 'Japan' },
  { code: '+962', name: 'Jordan' },
  { code: '+7', name: 'Kazakhstan' },
  { code: '+254', name: 'Kenya' },
  { code: '+965', name: 'Kuwait' },
  { code: '+996', name: 'Kyrgyzstan' },
  { code: '+856', name: 'Laos' },
  { code: '+371', name: 'Latvia' },
  { code: '+961', name: 'Lebanon' },
  { code: '+266', name: 'Lesotho' },
  { code: '+231', name: 'Liberia' },
  { code: '+423', name: 'Liechtenstein' },
  { code: '+370', name: 'Lithuania' },
  { code: '+352', name: 'Luxembourg' },
  { code: '+261', name: 'Madagascar' },
  { code: '+265', name: 'Malawi' },
  { code: '+60', name: 'Malaysia' },
  { code: '+960', name: 'Maldives' },
  { code: '+223', name: 'Mali' },
  { code: '+356', name: 'Malta' },
  { code: '+222', name: 'Mauritania' },
  { code: '+230', name: 'Mauritius' },
  { code: '+52', name: 'Mexico' },
  { code: '+373', name: 'Moldova' },
  { code: '+377', name: 'Monaco' },
  { code: '+976', name: 'Mongolia' },
  { code: '+382', name: 'Montenegro' },
  { code: '+212', name: 'Morocco' },
  { code: '+258', name: 'Mozambique' },
  { code: '+264', name: 'Namibia' },
  { code: '+977', name: 'Nepal' },
  { code: '+31', name: 'Netherlands' },
  { code: '+64', name: 'New Zealand' },
  { code: '+505', name: 'Nicaragua' },
  { code: '+227', name: 'Niger' },
  { code: '+234', name: 'Nigeria' },
  { code: '+389', name: 'North Macedonia' },
  { code: '+47', name: 'Norway' },
  { code: '+968', name: 'Oman' },
  { code: '+92', name: 'Pakistan' },
  { code: '+507', name: 'Panama' },
  { code: '+675', name: 'Papua New Guinea' },
  { code: '+595', name: 'Paraguay' },
  { code: '+51', name: 'Peru' },
  { code: '+63', name: 'Philippines' },
  { code: '+48', name: 'Poland' },
  { code: '+351', name: 'Portugal' },
  { code: '+974', name: 'Qatar' },
  { code: '+40', name: 'Romania' },
  { code: '+7', name: 'Russia' },
  { code: '+250', name: 'Rwanda' },
  { code: '+1-869', name: 'Saint Kitts and Nevis' },
  { code: '+1-758', name: 'Saint Lucia' },
  { code: '+1-784', name: 'Saint Vincent and the Grenadines' },
  { code: '+685', name: 'Samoa' },
  { code: '+378', name: 'San Marino' },
  { code: '+239', name: 'Sao Tome and Principe' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+221', name: 'Senegal' },
  { code: '+381', name: 'Serbia' },
  { code: '+248', name: 'Seychelles' },
  { code: '+232', name: 'Sierra Leone' },
  { code: '+65', name: 'Singapore' },
  { code: '+421', name: 'Slovakia' },
  { code: '+386', name: 'Slovenia' },
  { code: '+27', name: 'South Africa' },
  { code: '+82', name: 'South Korea' },
  { code: '+34', name: 'Spain' },
  { code: '+94', name: 'Sri Lanka' },
  { code: '+597', name: 'Suriname' },
  { code: '+46', name: 'Sweden' },
  { code: '+41', name: 'Switzerland' },
  { code: '+886', name: 'Taiwan' },
  { code: '+992', name: 'Tajikistan' },
  { code: '+255', name: 'Tanzania' },
  { code: '+66', name: 'Thailand' },
  { code: '+228', name: 'Togo' },
  { code: '+1-868', name: 'Trinidad and Tobago' },
  { code: '+216', name: 'Tunisia' },
  { code: '+90', name: 'Turkey' },
  { code: '+256', name: 'Uganda' },
  { code: '+380', name: 'Ukraine' },
  { code: '+971', name: 'United Arab Emirates' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+1', name: 'United States' },
  { code: '+598', name: 'Uruguay' },
  { code: '+998', name: 'Uzbekistan' },
  { code: '+678', name: 'Vanuatu' },
  { code: '+84', name: 'Vietnam' },
  { code: '+260', name: 'Zambia' },
  { code: '+263', name: 'Zimbabwe' },
];

const UserProfile = () => {
  const { user: authUser, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '',
    address: '',
    preferredPaymentMethod: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    referralCode: '',
    hasPaidVerificationFee: false,
    twoFactorEnabled: false,
    termsAccepted: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setFormData({
          name: response.name || `${response.firstName || ''} ${response.lastName || ''}`.trim(),
          email: response.email || '',
          phone: response.phone || '',
          countryCode: response.countryCode || '',
          address: response.address || '',
          preferredPaymentMethod: response.preferredPaymentMethod || '',
        });
        setProfileData({
          referralCode: response.referralCode || '',
          hasPaidVerificationFee: response.hasPaidVerificationFee || false,
          twoFactorEnabled: response.twoFactorEnabled || false,
          termsAccepted: response.termsAccepted || false,
        });
      } catch (error) {
        console.error('Error fetching profile:', error.response || error);
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || prev.name,
        email: authUser.email || prev.email,
        phone: authUser.phone || prev.phone,
        countryCode: authUser.countryCode || prev.countryCode,
        preferredPaymentMethod: authUser.preferredPaymentMethod || prev.preferredPaymentMethod,
      }));
      setProfileData({
        referralCode: authUser.referralCode || '',
        hasPaidVerificationFee: authUser.hasPaidVerificationFee || false,
        twoFactorEnabled: authUser.twoFactorEnabled || false,
        termsAccepted: authUser.termsAccepted || false,
      });
    }
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    try {
      // Validate inputs
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Invalid email address');
        return;
      }
      if (formData.phone && !/^\d{7,14}$/.test(formData.phone)) {
        setError('Invalid phone number');
        return;
      }
      if (formData.phone && !countryCodes.some((c) => c.code === formData.countryCode)) {
        setError('Invalid country code');
        return;
      }

      const response = await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setError('');
      await updateUser(); // Refresh AuthContext
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>

      <div className="bg-white p-6 rounded-xl shadow-md">
        {success && <p className="text-green-500 mb-4">{success}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Referral Code</label>
            <p className="mt-1">{profileData.referralCode || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Verification Fee Paid</label>
            <p className="mt-1">{profileData.hasPaidVerificationFee ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Two-Factor Authentication</label>
            <p className="mt-1">{profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Terms Accepted</label>
            <p className="mt-1">{profileData.termsAccepted ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1">{formData.name || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1">{formData.email || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Phone</label>
            {isEditing ? (
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="mt-1 w-32 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="712345678"
                />
              </div>
            ) : (
              <p className="mt-1">{formData.countryCode && formData.phone ? `${formData.countryCode}${formData.phone}` : 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Preferred Payment Method</label>
            {isEditing ? (
              <select
                name="preferredPaymentMethod"
                value={formData.preferredPaymentMethod}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="mpesa">M-Pesa</option>
                <option value="airtelmoney">Airtel Money</option>
                <option value="mtn">MTN</option>
                <option value="tigopesa">Tigo Pesa</option>
                <option value="skrill">Skrill</option>
                <option value="googlepay">Google Pay</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="mastercard">Mastercard</option>
              </select>
            ) : (
              <p className="mt-1">{formData.preferredPaymentMethod || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Address</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1">{formData.address || 'N/A'}</p>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;