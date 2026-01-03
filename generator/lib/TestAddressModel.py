import unittest

from lib.AddressModel import AddressModel


class TestAddressModel(unittest.TestCase):
    def test_normalized_address(self):
        data = {
            "OBJECTID": 1066922,
            "SAUID": None,
            "PlaceID": None,
            "County": "Arapahoe",
            "AddrNum": "22959",
            "NumSuf": None,
            "St_PreMod": None,
            "PreDir": "E",
            "PreType": None,
            "St_PreSep": None,
            "StreetName": "SMOKY HILL",
            "PostType": "RD",
            "PostDir": None,
            "St_PosMod": None,
            "Building": "E",
            "Floor": None,
            "Unit": "APT E101",
            "AddrFull": "22959 E SMOKY HILL RD APT E101",
            "PlaceName": "AURORA",
            "Zipcode": "80015",
            "Zipcode4": None,
            "Latitude": 39.60273106,
            "Longitude": -104.72087738,
            "Nbrhd_Comm": None,
            "Addtl_Loc": None,
            "Place_Type": None,
            "lsCAI": None,
            "ParcelID": None,
            "MOD_DATE": 1743120000000,
            "ACT_STAT": None,
            "geometry": b'\x01\x01\x00\x00\x00\xc8\xce\xdf\xda".Z\xc0\xe8}\x97J&\xcdC@',
        }
        model = AddressModel.model_validate(data)
        expected = "22959 E Smoky Hill Rd, Bldg E Apt E101"
        actual = model.normalized_address()
        self.assertEqual(expected, actual)


if __name__ == "__main__":
    unittest.main()
